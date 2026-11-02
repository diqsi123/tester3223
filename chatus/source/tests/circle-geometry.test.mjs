import {test} from 'node:test';
import assert from 'node:assert/strict';
import {circleGeometry,circleTime,createCircleReleaseGuard} from '../src/components/circle-geometry.ts';
test('circle source rings preserve independent outgoing2px and incoming3px media insets',()=>{
 assert.deepEqual(circleGeometry(true,false),{size:220,inset:2,mediaSize:216,rowHeight:236});
 assert.deepEqual(circleGeometry(false,false),{size:220,inset:3,mediaSize:214,rowHeight:236});
});
test('expanded circle remains370px with its original source ring and16px row clearance',()=>{
 assert.deepEqual(circleGeometry(true,true),{size:370,inset:2,mediaSize:366,rowHeight:386});
 assert.deepEqual(circleGeometry(false,true),{size:370,inset:3,mediaSize:364,rowHeight:386});
});
test('circle playback labels use whole elapsed media seconds without negative time',()=>{
 assert.equal(circleTime(-1),'0:00');assert.equal(circleTime(1.9),'0:01');assert.equal(circleTime(65),'1:05');
});

test('swipe-to-lock consumes its synthetic click; the next deliberate tap and keyboard still send',()=>{
 const guard=createCircleReleaseGuard();guard.begin();guard.lock();assert.equal(guard.shouldSend(1,true),false);
 guard.begin();assert.equal(guard.shouldSend(1,true),true);
 guard.begin();guard.lock();assert.equal(guard.shouldSend(0,true),true);
 // Browsers that omit the old click must not swallow the next new pointer gesture.
 guard.begin();guard.lock();guard.begin();assert.equal(guard.shouldSend(1,true),true);
 assert.equal(guard.shouldSend(1,false),false);
});
