---
key: blog
title: "🔍 Extracting Generic Function Signatures from Go AST: A Journey Through go/types"
date: 2025-10-02
last_modified_at: 2025-10-05
tags: [GoLang, Go, AST, Generics, go/types, Static Analysis, Compiler, Type System]
mermaid: true
header:
   teaser: /assets/images/apidiag_generics.png
   image: /assets/images/apidiag_generics.png
author: Ehab Terra
permalink: /ast-extracting-generic-function-signatures
subtitle: How I solved the challenge of extracting generic function signatures using go/types.Info.Uses as a fallback to TypeOf
excerpt: A deep dive into extracting generic function signatures from Go AST, exploring the limitations of go/types.Info.TypeOf and finding a robust solution using Info.Uses with TypeOf fallback.
---

## TL;DR

- `TypeOf` returns instantiated types from `Info.Types` (e.g., `func([]int)`), so it loses generic parameters and constraints.
- `Info.Uses` returns the full declared signature for external identifiers, including generics and constraints.
- Built-ins like `len` don’t appear in `Uses`; use `TypeOf` as a fallback.
- The working approach: try `Uses` first; if missing or built-in, fall back to `TypeOf`.

## The Challenge: Extracting Generic Signatures from Go AST 🎯

When building [apispec](https://github.com/ehabterra/apispec), I needed to extract function signatures from Go code, including generic parameters. This is crucial for generating accurate OpenAPI specifications from Go handlers and understanding the complete type information of functions.

The challenge? Go's `go/types` package has some interesting quirks when it comes to extracting generic function signatures, especially for standard library and external package functions. This was tested with **Go 1.24.3** on macOS.

## The Initial Approach: go/types.Info.TypeOf ❌

My first attempt used `go/types.Info.TypeOf` to extract function signatures. This seemed like the natural choice since it's designed to provide type information for AST nodes.

```go
// Initial approach - doesn't work for generics
func extractSignature(info *types.Info, callExpr *ast.CallExpr) string {
    if fun := info.TypeOf(callExpr.Fun); fun != nil {
        return fun.String()
    }
    return ""
}
```

**The Problem**: `TypeOf` works great for regular functions but fails to extract generic type parameters for functions like those in `golang.org/x/exp/slices`.

Here's a concrete example. When analyzing this code:

```go
package main

import "golang.org/x/exp/slices"

func main() {
    data := []int{3, 1, 4, 1, 5}
    slices.Sort(data) // <- This call
}
```

`TypeOf` would return something like:

```go
func([]int)
```

Instead of the complete generic signature:

```go
func[S ~[]E, E golang.org/x/exp/constraints.Ordered](x S)
```

This means you lose the crucial information about:

- The generic type parameters (`S` and `E`)
- The type constraints (`~[]E` and `golang.org/x/exp/constraints.Ordered`)
- The original generic signature structure

This limitation is a known challenge when working with `go/types` and generic functions. Looking at the Go source code, we can see why this happens:

```go
// From go/types/api.go line 346
func (info *Info) TypeOf(e ast.Expr) Type {
    return info.Types[e].Type
}
```

The `TypeOf` function simply returns the type from the `Types` map, which contains the **instantiated** type (e.g., `func([]int)`) rather than the original generic signature. The generic type parameters and constraints are stored separately in the type-checking process and aren't directly accessible through `TypeOf`.

## Understanding the Three Maps 🔍

To understand why this happens, we need to look at how `go/types` organizes type information:

- **`Types` map**: Contains instantiated types for expressions
- **`Defs` map**: Contains definitions (declarations) - only for locally defined objects  
- **`Uses` map**: Contains all uses of identifiers - both local and external

Here's what the test results show:

```go
// For a local generic function call: processData([]int{1, 2, 3})
TypeOf: func(items []int) []int           // Instantiated signature
Defs:   nil                               // Not in Defs (it's a use, not a definition)
Uses:   func[T any](items []T) []T        // Complete generic signature!

// For a built-in function call: len([]int{1, 2, 3})  
TypeOf: func([]int) int                  // Instantiated signature
Defs:   nil                              // Built-ins aren't in Defs
Uses:   invalid type                     // Limited information for built-ins
```

**Key insight**: `Defs` only contains locally defined objects, while `Uses` contains complete type information for external functions, including their generic signatures.

This behavior is documented in the Go source code (see `TypeOf` implementation at [api.go:346](https://cs.opensource.google/go/go/+/refs/tags/go1.25.1:src/go/types/api.go;l=346)) and comments:

> "For (possibly parenthesized) identifiers denoting built-in functions, the recorded signatures are call-site specific: if the call result is not a constant, the recorded type is an argument-specific signature. Otherwise, the recorded type is invalid."

And for external functions:

> "Similarly, no type is recorded for the (synthetic) FuncType node in a FuncDecl.Type field, since there is no corresponding syntactic function type expression in the source in this case. Instead, the function type is found in the Defs map entry for the corresponding function declaration."

This explains why `Defs` doesn't contain external functions like `json.NewDecoder` - they're defined elsewhere, not in the current package.

## Exploring Alternatives: Instances and Defs 🔍

Next, I tried using `Instances` and `Defs` from the `go/types` package, hoping they would provide access to generic declarations:

```go
// Attempted approaches that didn't work
func extractWithInstances(info *types.Info, callExpr *ast.CallExpr) string {
    // Instances didn't provide the generic signature
    for _, instance := range info.Instances {
        // Couldn't extract generic parameters effectively
    }
    return ""
}

func extractWithDefs(info *types.Info, callExpr *ast.CallExpr) string {
    // Defs also didn't provide the complete generic information
    if obj := info.Defs[callExpr.Fun]; obj != nil {
        // Still missing generic type parameters
    }
    return ""
}
```

Both approaches failed to extract the complete generic declarations I needed.

## The Breakthrough: Using Info.Uses ✅

After extensive research and experimentation, I discovered that `Info.Uses` provides access to the complete generic function signatures. This was the key to solving the problem:

```go
func extractSignatureWithUses(info *types.Info, callExpr *ast.CallExpr) string {
    if ident, ok := callExpr.Fun.(*ast.Ident); ok {
        if obj := info.Uses[ident]; obj != nil {
            if objType := obj.Type(); objType != nil {
                return objType.String()
            }
        }
    }
    return ""
}
```

**Why Info.Uses Works**: The `Uses` map contains the complete type information for identifiers, including their generic type parameters. When you look up a function identifier in `Uses`, you get access to the full generic signature.

## The Remaining Challenge: Built-in Functions 🚧

While `Info.Uses` worked beautifully for most functions, it had limitations with built-in functions like `len`, `make`, `append`, etc. These functions don't appear in the `Uses` map because they're built into the language.

## The Complete Solution: Hybrid Approach 🎯

I implemented a hybrid approach that uses `Info.Uses` as the primary method and falls back to `TypeOf` for built-in functions:

```go
func extractFunctionSignature(info *types.Info, callExpr *ast.CallExpr) string {
    // Simplified version - see full implementation below
    if ident, ok := callExpr.Fun.(*ast.Ident); ok {
        if obj := info.Uses[ident]; obj != nil {
            typ := obj.Type()
            if basicTyp, ok := typ.(*types.Basic); !ok || basicTyp.Kind() != types.Invalid {
                return typ.String()
            }
        }
    }
    
    // Fallback to TypeOf for built-in functions
    if funType := info.TypeOf(callExpr.Fun); funType != nil {
        return funType.String()
    }
    
    return ""
}
```

## Real-World Results 🌟

This approach produces amazing results! Here are some examples of the signatures I can now extract:

### Generic functions in external packages (x/exp/slices)

```go
// golang.org/x/exp/slices.Sort
func[S ~[]E, E golang.org/x/exp/constraints.Ordered](x S)

// golang.org/x/exp/slices.BinarySearch
func[S ~[]E, E cmp.Ordered](x S, target E) (int, bool)

// golang.org/x/exp/slices.Contains
func[S ~[]E, E comparable](s S, v E) bool
```

### Custom Generic Functions

```go
// github.com/ehabterra/apispec/testdata/generic.DecodeJSON
func[TData any](r *net/http.Request, v interface{}) (TData, error)

// github.com/ehabterra/apispec/testdata/generic.ProcessItems
func[T any](items []T, processor func(T) error) error
```

### Built-in Functions (via TypeOf fallback)

```go
// Built-in functions
func len(v Type) int
func make(t Type, size ...IntegerType) Type
func append(slice []Type, elems ...Type) []Type
```

## The Implementation in apispec 🔧

Here's how this is implemented in the [apispec project](https://github.com/ehabterra/apispec/blob/main/internal/metadata/metadata.go#L1346-L1380). This solution works with **Go 1.24.3** and should be compatible with other recent Go versions that support generics:

```go
func extractFunctionSignature(info *types.Info, callExpr *ast.CallExpr) string {
    if typ := getTypeWithGenerics(callExpr.Fun, info); typ != nil {
        return typ.String()
    }
    return ""
}

func getTypeWithGenerics(expr ast.Expr, info *types.Info) types.Type {
    var (
        instance types.Object
        found    bool
    )

    if indexExpr, ok := expr.(*ast.IndexExpr); ok {
        return getTypeWithGenerics(indexExpr.X, info)
    }

    // First try to get function information for generics
    switch fun := expr.(type) {
    case *ast.Ident:
        function, found = info.Uses[fun]
    case *ast.SelectorExpr:
        function, found = info.Uses[fun.Sel]
    case *ast.ParenExpr:
        if ident, ok := fun.X.(*ast.Ident); ok {
            function, found = info.Uses[ident]
        }
    }
    if found {
        typ := function.Type()
        if basicTyp, ok := typ.(*types.Basic); !ok || basicTyp.Kind() != types.Invalid {
            return typ
        }
    }

    // Fallback to TypeOf for non-generic types
    if typ := info.TypeOf(expr); typ != nil {
        return typ
    }

    return nil
}
```

## Visualizing the Results 🎨

The [apidiag UI](https://github.com/ehabterra/apispec/tree/main/cmd/apidiag) showcases these extracted signatures beautifully. The tool creates interactive call graphs that display:

- **Complete generic signatures** with type parameters and constraints
- **Call relationships** between functions
- **Type information** for each function call
- **Generic instantiations** showing how generic types are resolved

## Key Takeaways 💡

1. **Info.Uses is your friend**: For extracting complete generic function signatures, `Info.Uses` is the most reliable method in the `go/types` package.

2. **TypeOf has limitations**: While `TypeOf` works for basic type information, it doesn't provide access to generic type parameters for external functions.

3. **Hybrid approaches work best**: Combining `Info.Uses` with `TypeOf` fallback handles both generic functions and built-in functions effectively.

4. **AST analysis is powerful**: With the right approach, you can extract incredibly detailed type information from Go code, enabling sophisticated static analysis tools.

## The Impact on apispec 🚀

This breakthrough enabled apispec to:

- **Generate accurate OpenAPI specs** from Go code with full generic type information
- **Understand complex type relationships** in generic functions
- **Provide better error messages** when type mismatches occur
- **Create comprehensive call graphs** that show the complete picture of function relationships

## Conclusion 🎯

Extracting generic function signatures from Go AST was a challenging but rewarding journey. The key was understanding the different ways `go/types` exposes type information and combining them effectively.

The solution I found—using `Info.Uses` as the primary method with `TypeOf` as a fallback—provides comprehensive coverage for both generic and built-in functions. This approach has been instrumental in making apispec a powerful tool for Go API analysis and documentation generation.

If you're working on similar static analysis tools or need to extract detailed type information from Go code, I hope this experience helps you avoid some of the pitfalls I encountered and points you toward the right solution.

---

## References

- [apispec: Generate OpenAPI 3.1 from Go code](https://github.com/ehabterra/apispec)
- [apidiag: Interactive call graph visualization tool](https://github.com/ehabterra/apispec/tree/main/cmd/apidiag)
- [go/types package documentation](https://pkg.go.dev/go/types)
- [golang.org/x/exp/slices package](https://pkg.go.dev/golang.org/x/exp/slices)
- [Go Blog: When to use generics](https://tip.golang.org/blog/when-generics)
- [Go issue #47916: Additions to go/types to support type parameters](https://github.com/golang/go/issues/47916) - Discusses the need for new constructs like `Inferred` to handle type arguments
- [Go Blog: Deconstructing Type Parameters](https://go.dev/blog/deconstructing-type-parameters) - Provides context on the complexity of generic function signatures
- [go/types/api.go TypeOf implementation](https://cs.opensource.google/go/go/+/refs/tags/go1.25.1:src/go/types/api.go;l=346) - Shows how TypeOf simply returns from the Types map
