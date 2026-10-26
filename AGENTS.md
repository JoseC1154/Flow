<!-- FILE: AGENTS.md -->
# PayPath guidance for future AI coding agents

## Before modifying anything
- Read `index.html`, `styles.css`, `app.js`, this file, and `README.md` before making changes.
- Preserve the exact first-line file signature in each existing file.
- Edit existing files in place. Do not create a duplicate app, page, or canvas.
- Keep the responsive dark navy (#0d192b / #142137) and mint-green (#99ebc7) theme.
- Retain keyboard accessibility, visible focus indicators, touch targets, and readable contrast.

## UI controls: mandatory visual consistency
- **Never add an unstyled native select or browser-default numeric spinner.**
- For every `<select>`, place it within the shared `.input` wrapper so `.input select` gives dark background, light text, and a clearly visible mint chevron. Apply these same styles to new dropdowns; do not style just one element ID.
- For editable `input[type=number]`, use the theme-matched +/- stepper buttons created by `installNumberSteppers()` in `app.js`. Do not add default browser number spinners or duplicate custom steppers.
- Keep the text field editable by keyboard, honor min/max/step, and dispatch the `input` event after clicking +/- so calculations update. Exclude readonly inputs.
- For date controls, maintain the high-contrast, clickable calendar affordance and dark popup-friendly `color-scheme`.
- Check desktop and mobile sizes, keyboard interaction, labels, and hover/focus states any time a control is added.
- Increment the CSS or JS query-string version in `index.html` when appropriate so GitHub Pages users receive updated assets.

## Calculation invariants
- An employee has five guaranteed eight-hour regular tours each week, but regular tour start times rotate and must not be hardcoded as a specific tour.
- Operations run 24/7 with three eight-hour tours: 23:00–07:00, 07:00–15:00, and 15:00–23:00.
- At most two consecutive eight-hour tours can be worked, not three; actual rotation and rest intervals can reduce available overtime.
- Only one of the employee's two days off may be worked per week.
- Overtime pays at 1.5 × hourly rate, using actual planned overtime, with a choice of total through year-end or tours per week.
- The automatic or custom as-of date drives *all* remaining time and shifts; count dates after the as-of date to December 31.
- Continue showing numerical OT required even when above estimated capacity. Label capacity estimates as theoretical, not guaranteed assigned shifts.
- Projected year-end gross = YTD earnings + estimated remaining guaranteed regular pay + planned OT pay.

## Validation checklist
- Verify the first-line signature before and after editing each file.
- Test both date modes, both overtime entry modes, zero days left, zero OT, very high OT, and values exceeding estimated capacity.
- Test number +/- buttons (keyboard and pointer), both dropdowns, date picker, and responsive layout.
- Keep `README.md` updated for calculation changes and new user-facing controls.
