
# Go 1.20’s `errors.Join` and the Great Unwrap Mystery: A Developer’s Journey

## Introduction

As a Go developer, I once thought `errors.Join` would simplify my error handling—until I discovered it silently breaks `errors.Unwrap`. Let me walk you through this rabbit hole, complete with source code spelunking and a community debate that’s still simmering.

```go
err1 := errors.New("error 1")
err2 := errors.New("error 2")
joined := errors.Join(err1, err2)

// Wait, why is this nil?!
fmt.Println(errors.Unwrap(joined)) // nil
```

---

## The Three Faces of Go Errors

Go 1.20 introduced three error types that left me baffled:

```go
// 1. For errors.Join(...)
type joinError struct { errs []error }

// 2. For fmt.Errorf with multiple %w verbs (NEW)
type wrapErrors struct { msg string; errs []error }

// 3. Traditional fmt.Errorf("%w", err)
type wrapError struct { msg string; err error }
```

### Why the Complexity?
Russ Cox explains in the Go 2 error handling proposal:

> "We made a conscious choice to use explicit error results and explicit error checks to avoid the pitfalls of implicit exception handling."

But explicit doesn’t always mean simple. Let’s dissect the chaos.

---

## `fmt.Errorf`’s Hidden Surprise: Multiple %w Verbs (NEW)

You might think `fmt.Errorf` with multiple `%w` works like `errors.Join`:

```go
wrapped := fmt.Errorf("wrapper: %w, %w", err1, err2)
```

But under the hood, this creates a `wrapErrors` struct (not `joinError`). While it preserves error order, `errors.Unwrap` still fails:

```go
fmt.Println(errors.Unwrap(wrapped)) // nil (same as errors.Join!)
```

### Key Insight:

- `errors.Join`: Flattens errors into a slice.
- `fmt.Errorf("%w, %w")`: Preserves hierarchy but still breaks `Unwrap`.

---

## Why `Unwrap` Ignores Slices

The `errors.Unwrap` function only handles single errors:

```go
// go/src/errors/wrap.go (Go 1.20+)
// Source: https://cs.opensource.google/go/go/+/refs/tags/go1.20:src/errors/wrap.go
func Unwrap(err error) error {
    u, ok := err.(interface{ Unwrap() error })  // ❌ No slice support!
    if !ok {
        return nil
    }
    return u.Unwrap()
}
```

### The Go Team’s Rationale:

1. **Backward Compatibility**: Existing code relies on `Unwrap` for single-error chains.
2. **Explicit Design**: Forces developers to handle multi-errors intentionally.

---

## The Community Backlash: Proposal #66455 (NEW)

Developers protested this behavior in [GitHub #66455](https://github.com/golang/go/issues/66455), arguing:

> "Unwrap should support slices to simplify error traversal."

### Why the Proposal Was Declined:

- Lack of evidence for widespread issues.
- Concerns about complicating the error interface.

### My Take:

While the Go team prioritizes stability, this leaves developers writing boilerplate like:

```go
func UnwrapAll(err error) []error {
    switch e := err.(type) {
    case interface{ Unwrap() []error }: // joinError/wrapErrors
        return e.Unwrap()
    case interface{ Unwrap() error }:   // Traditional wrapError
        return []error{e.Unwrap()}
    default:
        return nil
    }
}
```

---

## Lessons from the Go 2 Proposal

Russ Cox’s vision for Go 2 error handling clarifies why we’re here:

1. **Explicit > Implicit**: Avoid "invisible" error checks like exceptions.
2. **Toolability First**: Errors must work with static analysis and debugging tools.
3. **Wrapping Without Breaking**: The `errors.Wrapper` interface aims to standardize error chains.

Yet, as Cox admits:

> "Existing code must keep working. Any changes must interoperate."

This explains why `Unwrap` remains restrictive—backward compatibility trumps convenience.

---

## Best Practices for 2025

### Use `errors.Join` For:
- Flat error aggregation (e.g., batch processing).
- Cases where error hierarchy doesn’t matter.

### Use `fmt.Errorf` For:
- Ordered error wrapping (e.g., contextual chains).
- Compatibility with `errors.Is`/`errors.As`.

### Always Test `Unwrap` Behavior:

```go
func TestJoinUnwrap(t *testing.T) {
    joined := errors.Join(errors.New("err1"), errors.New("err2"))
    if errors.Unwrap(joined) != nil {
        t.Fatal("Unwrap should return nil for joinError!")
    }
}
```

---

## Conclusion: Embrace the Chaos

Go’s error handling is a trade-off:

- **Pros**: Explicitness, toolability, and no hidden control flow.
- **Cons**: Boilerplate and confusing edge cases.

### Join the Discussion:

- How do you handle multi-errors?
- Should `Unwrap` support slices? Vote in the comments!

---

## Resources

- [Error Handling in Go 1.13](https://go.dev/blog/go1.13-errors)
- [Error Handling and Go](https://go.dev/blog/error-handling-and-go)
- [Errors Are Values: A Guide to Error Handling in Go](https://dev.to/fredgitonga/errors-are-values-a-guide-to-error-handling-in-go-3ohi)
