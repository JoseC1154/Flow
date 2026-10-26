<!-- FILE: README.md -->
# PayPath — Annual Earnings Planner
https://josec1154.github.io/Flow/index.html

A responsive, browser-based calculator for estimating how many regular workdays and time-and-a-half overtime shifts are required to reach an annual gross earnings goal.

## How to use

Open `index.html` in a browser. Enter year-to-date gross earnings, annual gross earnings goal, base hourly pay, hours per regular workday, extra hours per overtime day, and the number of overtime days you plan to work. Results update automatically.

## Calculations

- **Regular day pay:** hourly rate × hours per regular day.
- **Extra overtime day pay:** hourly rate × 1.5 × extra overtime hours.
- **Remaining amount:** max(0, annual goal − YTD gross earnings).
- **Workdays left:** user-entered fixed number of available regular workdays (defaults to 48). Changing planned overtime does not affect this number.
- **Weeks left:** calendar days after today through December 31 divided by 7.
- **Total OT days needed:** max(0, ceiling((remaining goal − all remaining weekday regular pay) ÷ extra OT day pay)).
- **Additional OT days:** max(0, total OT days needed − planned OT days), if the goal is achievable within remaining workdays.
- **Regular workdays required:** exactly the user-entered remaining regular workdays, independent of planned overtime.
- **Planned OT days:** capped at remaining workdays. If total needed OT days exceed remaining workdays, the goal is marked not possible.
- **Projected gross earnings:** YTD + all remaining regular weekday pay + planned OT earnings.

The device date controls calendar weeks remaining, while the separate workday input determines remaining regular and overtime opportunities. Assumes today's pay is already reflected in YTD earnings. OT hours are *extra* hours on top of regular working days. Working past the end of the year is not considered. Some combinations of required days are not feasible; the app flags common infeasible plans.

## Limitations

Estimates are before taxes and deductions. The app does not track varying weekly schedules, missed work, paid holidays, paid time off, changing wages, payroll cutoffs, annual overtime exclusions, or employer-specific overtime policies. It stores no personal data and sends no information to a server.

## Files

- `index.html` — user interface
- `styles.css` — responsive visual styling
- `app.js` — calculations and validation

## Publishing via GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save. After publication, the app should be available at `https://josec1154.github.io/Flow/`.
