https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots

Code style:

## Prior value +'' instead of (value).toString()

- `value + ''` converts in to a string any value.
- `(undefined).toString()` fails with an exception.