// FILE: app.js
"use strict";
const el = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const whole = (value) => new Intl.NumberFormat("en-US").format(value);
const dateNow = () => new Date();
function daysUntilYearEnd(today){
  return Math.max(0,Math.round((Date.UTC(today.getFullYear(),11,31)-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000));
}
function remainingSchedule(today){
  const calendarDays=daysUntilYearEnd(today);
  let regular=0;
  const end=new Date(today.getFullYear(),11,31);
  for(let date=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);
      date<=end;date.setDate(date.getDate()+1)){
    if(date.getDay()!==0&&date.getDay()!==6)regular++;
  }
  // Tour-neutral upper bound: at most two 8-hour tours per calendar day.
  // Every regular tour occupies one slot. Five regular tours per week are
  // approximated by weekday count; actual rotating days off may differ.
  // Two consecutive tours are permitted, but never a third consecutive tour.
  const daysOff=calendarDays-regular;
  const regularDayOT=regular;
  const dayOffOT=daysOff*2;
  const maxOT=regularDayOT+dayOffOT;
  return {regular,daysOff,regularDayOT,dayOffOT,slots:calendarDays*3,maxOT};
}
function selectedAsOfDate(){
  if(el("dateMode").value!=="custom") return dateNow();
  const value=el("customDate").value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year,month,day]=value.split("-").map(Number);
  const parsed=new Date(year,month-1,day);
  if(parsed.getFullYear()!==year||parsed.getMonth()!==month-1||parsed.getDate()!==day) return null;
  return parsed;
}
function updateDateMode(){
  const custom=el("dateMode").value==="custom";
  el("customDateField").hidden=!custom;
  el("customDateField").style.display=custom?"":"none";
  el("customDate").disabled=!custom;
  el("dateModeExplanation").textContent=custom?"Using the selected date.":"Using today's date automatically.";
  if(custom&&!el("customDate").value){
    const now=dateNow();
    const pad=(n)=>String(n).padStart(2,"0");
    el("customDate").value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  }
  calculate();
}
function calculate(){
  const ids=["ytd","goal","rate","hours","otHours","otDays"];
  const n=Object.fromEntries(ids.map(id=>[id,Number(el(id).value)]));
  const error=el("error");
  if(ids.some(id=>el(id).value.trim()===""||!Number.isFinite(n[id]))||
    n.ytd<0||n.goal<=0||n.rate<=0||n.hours!==8||n.otHours!==8||
    n.otDays<0||!Number.isInteger(n.otDays)){
    error.hidden=false;
    error.textContent="Enter valid earnings, 8-hour shifts, and a whole number of planned overtime shifts.";
    return;
  }
  error.hidden=true;
  const today=selectedAsOfDate();
  if(!today){
    error.hidden=false;
    error.textContent="Please select a valid calculation date.";
    return;
  }
  const calendarDays=daysUntilYearEnd(today);
  const schedule=remainingSchedule(today);
  const regularPay=n.rate*8;
  const overtimePay=n.rate*1.5*8;
  const remaining=Math.max(0,n.goal-n.ytd);
  const gap=Math.max(0,remaining-schedule.regular*regularPay);
  const neededOT=gap<=0?0:Math.ceil((gap-0.0000001)/overtimePay);
  const plannedShifts=Math.min(n.otDays,schedule.maxOT);
  const additionalOT=Math.max(0,neededOT-plannedShifts);
  const achievable=neededOT<=schedule.maxOT;
  const forecast=n.ytd+schedule.regular*regularPay+plannedShifts*overtimePay;
  const percent=Math.min(100,n.ytd/n.goal*100);
  const startText=today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const endText=`Dec 31, ${today.getFullYear()}`;
  const modeText=el("dateMode").value==="custom"?"Custom date":"Automatic date";
  el("dateLabel").textContent=`${modeText}: ${startText}`;
  el("forecastRange").textContent=`Calculations cover ${whole(calendarDays)} calendar days after ${startText} through ${endText} (including weekends).`;
  el("remainingDaysLabel").textContent=`Calendar days after ${today.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
  el("remainingWeeksLabel").textContent="Weeks remaining in selected date range";
  el("percent").textContent=`${percent.toFixed(1)}% achieved`;
  el("progress").style.width=`${percent}%`;
  el("remaining").textContent=money(remaining);
  el("weeks").textContent=(calendarDays/7).toFixed(1);
  el("weekdays").textContent=whole(calendarDays);
  el("shiftSlots").textContent=whole(schedule.slots);
  el("otCapacity").textContent=whole(schedule.maxOT);
  el("daysOff").textContent=whole(schedule.dayOffOT);
  el("lateClears").textContent=whole(schedule.regularDayOT);
  el("dayPay").textContent=money(regularPay);
  el("otPay").textContent=money(overtimePay);
  // Always show required OT as a number; feasibility is explained separately.
  el("minimumOT").textContent=whole(additionalOT);
  el("requiredRegular").textContent=whole(schedule.regular);
  el("yearEndTotal").textContent=money(forecast);
  el("ytdBreakdown").textContent=money(n.ytd);
  el("regularEarnings").textContent=money(schedule.regular*regularPay);
  el("projected").textContent=money(forecast);
  const difference=forecast-n.goal;
  el("goalDifference").textContent=(difference>=0?"+":"−")+money(Math.abs(difference));
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedShifts*overtimePay);
  let message;
  if(remaining===0)message="You've already reached your annual goal.";
  else if(calendarDays===0)message="No calendar days remain this year.";
  else if(!achievable)message=`Your earnings goal requires ${whole(neededOT)} overtime tours (${whole(additionalOT)} beyond the ${whole(plannedShifts)} planned). The estimated upper limit is ${whole(schedule.maxOT)} OT tours: up to one extra tour on each of ${whole(schedule.regular)} regular workdays and up to two on each of ${whole(schedule.daysOff)} days off. This estimate does not assume any particular assigned tour. The projected shortfall at maximum capacity is ${money(Math.max(0,gap-schedule.maxOT*overtimePay))}.`;
  else if(additionalOT===0)message=neededOT===0?"Your projected regular tours alone meet the goal.":"Your planned overtime covers the additional tours required for your goal.";
  else message=`With ${whole(schedule.regular)} guaranteed regular tours across ${whole(calendarDays)} remaining calendar days, the upper-bound estimate is ${whole(schedule.maxOT)} possible OT tours. Your ${whole(plannedShifts)} planned OT tours count toward ${whole(neededOT)} needed, leaving ${whole(additionalOT)} more. No specific regular tour is assumed.`;
  if(n.otDays>schedule.maxOT)message+=" Planned overtime was capped at the estimated maximum.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
el("dateMode").addEventListener("change",updateDateMode);
el("customDate").addEventListener("change",calculate);
updateDateMode();
