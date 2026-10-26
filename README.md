<!-- FILE: README.md -->
# PayPath — Annual Earnings Planner

A responsive, browser-based calculator for estimating how many regular workdays and time-and-a-half overtime shifts are required to reach an annual gross earnings goal.

## How to use

Open `index.html` in a browser. Enter year-to-date gross earnings, annual gross earnings goal, base hourly pay, hours per regular workday, extra hours per overtime day, and the number of overtime days you plan to work. Results update automatically.

## Calculations

- **Regular day pay:** hourly rate × hours per regular day.
- **Extra overtime day pay:** hourly rate × 1.5 × extra overtime hours.
- **Remaining amount:** max(0, annual goal − YTD gross earnings).
- **Days left:** Monday–Friday dates after today through December 31; no holiday exclusions.
- **Weeks left:** calendar days after today through December 31 divided by 7.
- **Required OT days:** max(0, ceiling((remaining goal − all future weekday regular pay) ÷ extra OT day pay)).
- **Regular days needed with planned overtime:** max(0, ceiling((remaining goal − planned OT pay) ÷ regular day pay)).
- **Projected gross earnings:** YTD + all remaining regular weekday pay + planned OT earnings.

Assumes today's pay is already reflected in YTD earnings. OT hours are *extra* hours on top of regular working days. Working past the end of the year is not considered. Some combinations of required days are not feasible; the app flags common infeasible plans.

## Limitations

Estimates are before taxes and deductions. The app does not track varying weekly schedules, missed work, paid holidays, paid time off, changing wages, payroll cutoffs, annual overtime exclusions, or employer-specific overtime policies. It stores no personal data and sends no information to a server.

## Files

- `index.html` — user interface
- `styles.css` — responsive visual styling
- `app.js` — calculations and validation

## Publishing via GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save. After publication, the app should be available at `https://josec1154.github.io/Flow/`.
