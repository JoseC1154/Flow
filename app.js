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
  const slots=[];
  const end=new Date(today.getFullYear(),11,31);
  let regular=0;
  // Each business date has shifts starting 07:00, 15:00, 23:00.
  // Assume regular weekday shift 07:00–15:00 until employee's rotation is known.
  for(let date=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);
      date<=end;date.setDate(date.getDate()+1)){
    const weekday=date.getDay()!==0&&date.getDay()!==6;
    for(const startHour of [7,15,23]){
      const isRegular=weekday&&startHour===7;
      slots.push(isRegular);
      if(isRegular)regular++;
    }
  }
  // Dynamic programming: worked and off track the last 8-hour slot.
  // Consecutive worked slots are forbidden, including regular-to-OT transitions.
  let off=0,worked=Number.NEGATIVE_INFINITY;
  for(const isRegular of slots){
    const nextOff=isRegular?Number.NEGATIVE_INFINITY:Math.max(off,worked);
    const nextWorked=off+(isRegular?0:1);
    off=nextOff;
    worked=nextWorked;
  }
  return {regular, slots:slots.length, maxOT:Math.max(0,off,worked)};
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
  const today=dateNow();
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
  else if(!achievable)message=`Your goal calls for ${whole(neededOT)} total OT shifts, including ${whole(plannedShifts)} planned shifts. That means ${whole(additionalOT)} more OT shifts are needed, but the estimated schedule only allows ${whole(schedule.maxOT)} total OT shifts with 8 hours of rest between shifts. This includes opportunities on your two weekly days off. At the current rate, the goal would remain ${money(Math.max(0,gap-schedule.maxOT*overtimePay))} short even if every estimated OT opportunity were worked.`;
  else if(additionalOT===0)message=neededOT===0?"Your projected regular shifts alone meet the goal.":"Your planned OT shifts cover the overtime required for your goal.";
  else message=`You have ${whole(schedule.regular)} guaranteed regular shifts and ${whole(schedule.maxOT)} possible additional OT shifts under the assumed schedule, including days off. Your ${whole(plannedShifts)} planned OT shifts count toward ${whole(neededOT)} needed, leaving ${whole(additionalOT)} more OT shifts to schedule.`;
  if(n.otDays>schedule.maxOT)message+=" Planned OT was capped to the rest-rule maximum.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
calculate();
