// FILE: app.js
"use strict";
const el = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const whole = (value) => new Intl.NumberFormat("en-US").format(value);
const dateNow = () => new Date();
function weekdaysRemaining(today){
  let count=0;
  const end=new Date(today.getFullYear(),11,31);
  for(let d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);d<=end;d.setDate(d.getDate()+1)){
    if(d.getDay()!==0&&d.getDay()!==6)count++;
  }
  return count;
}
function calculate(){
  const ids=["ytd","goal","rate","hours","otHours","otDays","workdays"];
  const n=Object.fromEntries(ids.map(id=>[id,Number(el(id).value)]));
  const error=el("error");
  if(ids.some(id=>el(id).value.trim()===""||!Number.isFinite(n[id]))||n.ytd<0||n.goal<=0||n.rate<=0||n.hours<=0||n.hours>24||n.otHours<=0||n.otHours>24||n.otDays<0||!Number.isInteger(n.otDays)||n.workdays<0||n.workdays>366||!Number.isInteger(n.workdays)){
    error.hidden=false;error.textContent="Please enter valid earnings and hours, with a whole number of overtime days.";return;
  }
  error.hidden=true;
  const today=dateNow();
  const calendarDays=Math.max(0,Math.round((Date.UTC(today.getFullYear(),11,31)-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000));
  // User-supplied remaining workdays override the device-date weekday count.
  const days=n.workdays;
  const regularPay=n.rate*n.hours;
  const overtimePay=n.rate*1.5*n.otHours;
  const remaining=Math.max(0,n.goal-n.ytd);
  const gap=Math.max(0,remaining-days*regularPay);
  const neededOT=gap<=0?0:Math.ceil((gap-0.0000001)/overtimePay);
  // Three 8-hour shifts (AM, PM, midnight) per workday.
  // One regular 8-hour shift is already occupied, leaving up to 16 OT hours.
  const totalShiftSlots=days*3;
  const availableOTHours=Math.max(0,totalShiftSlots*8-days*n.hours);
  const maxOTShifts=Math.floor((availableOTHours+0.0000001)/n.otHours);
  const plannedDays=Math.min(n.otDays,maxOTShifts);
  const plannedOTPay=plannedDays*overtimePay;
  const additionalOT=Math.max(0,neededOT-plannedDays);
  const achievable=neededOT<=maxOTShifts;
  const forecast=n.ytd+days*regularPay+plannedOTPay;
  const percent=Math.min(100,n.ytd/n.goal*100);
  el("dateLabel").textContent=`${today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} to December 31 · ${whole(days)} workdays entered`;
  el("percent").textContent=`${percent.toFixed(1)}% achieved`;
  el("progress").style.width=`${percent}%`;
  el("remaining").textContent=money(remaining);
  el("weeks").textContent=(calendarDays/7).toFixed(1);
  el("weekdays").textContent=whole(days);
  el("dayPay").textContent=money(regularPay);
  el("otPay").textContent=money(overtimePay);
  el("minimumOT").textContent=achievable?whole(additionalOT):"Not possible";
  el("requiredRegular").textContent=whole(days);
  el("projected").textContent=money(forecast);
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedOTPay);
  let message;
  if(remaining===0)message="Congratulations! You've already reached your annual goal.";
  else if(days===0)message="No weekdays remain this year. Consider planning for next year.";
  else if(!achievable)message=`Not possible within the available shift capacity: ${whole(days)} days provide ${whole(totalShiftSlots)} eight-hour shift slots. After regular work, up to ${whole(maxOTShifts)} overtime shifts of ${n.otHours} hours fit. Even using all available OT hours would leave ${money(Math.max(0,gap-availableOTHours*n.rate*1.5))} short. Adjust the goal, hours, or available workdays.`;
  else if(additionalOT===0)message=neededOT===0?"Regular workdays alone can meet your goal; overtime is optional.":`Your ${whole(plannedDays)} planned OT days cover the ${whole(neededOT)} OT days needed. No additional OT days are required.`;
  else message=`Across ${whole(days)} workdays there are ${whole(totalShiftSlots)} possible eight-hour shift slots, of which regular work occupies ${whole(days)}. You have ${whole(plannedDays)} planned OT shifts toward ${whole(neededOT)} required, leaving ${whole(additionalOT)} additional OT shifts.`;
  if(n.otDays>maxOTShifts)message+=" Planned OT was capped at available overtime shift capacity.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
calculate();
