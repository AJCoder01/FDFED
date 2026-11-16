import assert from 'node:assert/strict';
import {test} from 'node:test';
import {availableSlots,DEFAULT_SCHEDULE,validDate,validateSlots,validateSchedule} from './scheduling.js';
const service={id:'s',providerId:'p',status:'published',duration:'60 mins',availableSlots:['09:00 AM','10:00 AM','11:30 AM','02:00 PM']};
const provider={verificationStatus:'approved',weeklyAvailability:{...DEFAULT_SCHEDULE,days:['Mon']}};
test('lead time is interpreted in Asia/Kolkata',()=>assert.deepEqual(availableSlots(service,{...provider,weeklyAvailability:{...provider.weeklyAvailability,leadMinutes:90}},'2026-10-12',[],[],null,new Date('2026-10-12T04:30:00Z')),['02:00 PM']));
test('buffer applies across services and current booking can be excluded',()=>{const job={id:'b',serviceId:'other',providerId:'p',scheduledDate:'2026-10-12',scheduledSlot:'09:00 AM',duration:'60 mins',status:'active'};const p={...provider,weeklyAvailability:{...provider.weeklyAvailability,bufferMinutes:15}};assert.deepEqual(availableSlots(service,p,'2026-10-12',[job],[],null,new Date('2026-10-10')),['11:30 AM','02:00 PM']);assert.equal(availableSlots(service,p,'2026-10-12',[job],[],'b',new Date('2026-10-10')).length,4);});
test('calendar and schedule validation reject impossible values',()=>{assert.equal(validDate('2027-02-30'),false);assert.match(validateSlots(['09:00 AM','09:30 AM'],60),/enough time/);assert.match(validateSchedule({...DEFAULT_SCHEDULE,startTime:'19:00',endTime:'09:00'}),/End time/);});
