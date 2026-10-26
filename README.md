<!-- FILE: README.md -->
# PayPath — Annual Earnings Planner
https://josec1154.github.io/Flow/index.html

A responsive, browser-based calculator for estimating how many regular workdays and time-and-a-half overtime shifts are required to reach an annual gross earnings goal.

## How to use

Open `index.html` in a browser. Enter year-to-date gross earnings, annual gross earnings goal, base hourly pay, hours per regular workday, hours per overtime shift, and the number of overtime shifts you plan to work. Results update automatically.

## Calculations

- **Regular day pay:** hourly rate × hours per regular day.
- **Overtime shift pay:** hourly rate × 1.5 × overtime shift hours (defaults to 8 hours).
- **Remaining amount:** max(0, annual goal − YTD gross earnings).
- **Days left:** automatically counted calendar days after today through December 31, including weekends. The value is read-only.
- **Weeks left:** calendar days after today through December 31 divided by 7.
- **Available shift slots:** remaining calendar days × 3 (AM, PM, midnight). E.g. 48 days = 144 eight-hour slots.
- **OT capacity:** shift-slot hours minus regular-work hours; for 48 eight-hour regular days, 96 additional eight-hour OT shifts fit, assuming all slots are available.
- **Total OT shifts needed:** max(0, ceiling((remaining goal − remaining regular earnings) ÷ OT shift pay)).
- **Additional OT shifts:** max(0, total OT shifts needed − planned OT shifts), provided total needed shifts fit the remaining OT-hour capacity.
- **Regular shifts assumed:** one regular shift per remaining calendar day, unaffected by planned overtime.
- **Planned OT shifts:** capped at available OT-hour capacity (not capped to one overtime shift per day). Impossible goals are flagged only when required OT exceeds available OT shift capacity.
- **Projected gross earnings:** YTD + all assumed remaining regular-shift pay + planned OT earnings.

The device date determines days remaining, and all seven days of the week count in the 24/7 operation. The day count is not editable. Assumes today's pay is already reflected in YTD earnings. OT hours are *extra* hours on top of regular working days. Shift-slot capacity is a theoretical maximum, not a guarantee of employer scheduling, staffing, rest periods, or legal eligibility. Working past the end of the year is not considered. Some combinations of required days are not feasible; the app flags common infeasible plans.

## Limitations

Estimates are before taxes and deductions. The app does not track varying weekly schedules, missed work, paid holidays, paid time off, changing wages, payroll cutoffs, annual overtime exclusions, or employer-specific overtime policies. It stores no personal data and sends no information to a server.

## Files

- `index.html` — user interface
- `styles.css` — responsive visual styling
- `app.js` — calculations and validation

## Publishing via GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save. After publication, the app should be available at `https://josec1154.github.io/Flow/`.
