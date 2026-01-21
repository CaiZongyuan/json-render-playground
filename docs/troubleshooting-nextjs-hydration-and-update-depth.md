## Console Error: Maximum update depth exceeded

**Symptoms**
- Console error: `Maximum update depth exceeded`
- Stack trace points to: `src/app/page.tsx` when rendering `Renderer` (actual cause is a state update loop in a child component)

**Root Cause (in this project)**
- `TextField` uses `useFieldValidation(valuePath, config)`, but `config` is created as a literal object in render:
  - The `config` reference changes on every render
  - `@json-render/react` internally has `useEffect(..., [path, config, registerField])`, causing `registerField` to run on every render
  - `registerField` internally calls `setFieldConfigs` which triggers Provider re-render → creates an infinite loop

**Fix (in this project)**
- In `src/components/ui/text-field.tsx`:
  - Use `useMemo` to generate a stable `validationConfig`, then pass it to `useFieldValidation`
