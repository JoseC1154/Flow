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
  // Illustrative rotating midnight schedule: 23:00–07:00, then late clear
  // 07:00–15:00, then 15:00–23:00 off (8 hours off before next report).
  // Each calendar day supplies two 8-hour shifts in this pattern.
  // Five midnight reports per week are guaranteed regular shifts;
  // reports on remaining days are OT. Late clears are all OT.
  const daysOff=calendarDays-regular;
  const lateClears=calendarDays;
  const maxOT=daysOff+lateClears;
  return {regular,daysOff,lateClears,slots:calendarDays*3,maxOT};
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
  el("customDate").disabled=!custom;
  el("dateModeExplanation").textContent=custom?"Using the selected date.":"Using today's date automatically.";
  if(custom&&!el("customDate").value){
    const now=dateNow();
    const pad=(n)=>String(n).padStart(2,"0");
    el("customDate").value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  }
  updateDateMode();
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
  el("dateLabel").textContent=`${today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} to December 31 · 24/7 operation`;
  el("percent").textContent=`${percent.toFixed(1)}% achieved`;
  el("progress").style.width=`${percent}%`;
  el("remaining").textContent=money(remaining);
  el("weeks").textContent=(calendarDays/7).toFixed(1);
  el("weekdays").textContent=whole(calendarDays);
  el("shiftSlots").textContent=whole(schedule.slots);
  el("otCapacity").textContent=whole(schedule.maxOT);
  el("daysOff").textContent=whole(schedule.daysOff);
  el("lateClears").textContent=whole(schedule.lateClears);
  el("dayPay").textContent=money(regularPay);
  el("otPay").textContent=money(overtimePay);
  // Always show required OT as a number; feasibility is explained separately.
  el("minimumOT").textContent=whole(additionalOT);
  el("requiredRegular").textContent=whole(schedule.regular);
  el("projected").textContent=money(forecast);
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedShifts*overtimePay);
  let message;
  if(remaining===0)message="You've already reached your annual goal.";
  else if(calendarDays===0)message="No calendar days remain this year.";
  else if(!achievable)message=`Your goal requires ${whole(neededOT)} OT shifts (${whole(additionalOT)} beyond ${whole(plannedShifts)} planned). The rotating midnight + late-clear example offers up to ${whole(schedule.maxOT)} OT shifts: ${whole(schedule.daysOff)} midnight reports on days off plus ${whole(schedule.lateClears)} late clears. The remaining estimated earnings shortfall is ${money(Math.max(0,gap-schedule.maxOT*overtimePay))}.`;
  else if(additionalOT===0)message=neededOT===0?"Your projected regular shifts alone meet the goal.":"Your planned OT shifts cover the overtime required for your goal.";
  else message=`Example capacity: ${whole(schedule.regular)} guaranteed midnight shifts, ${whole(schedule.daysOff)} overtime midnight shifts on days off, and ${whole(schedule.lateClears)} overtime late clears. This allows up to ${whole(schedule.maxOT)} OT shifts when a midnight report is followed by a late clear and then 8 hours off. Your plan has ${whole(plannedShifts)} OT shifts, leaving ${whole(additionalOT)} additional shifts needed.`;
  if(n.otDays>schedule.maxOT)message+=" Planned OT was capped at the illustrated shift capacity.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
el("dateMode").addEventListener("change",updateDateMode);
calculate();
