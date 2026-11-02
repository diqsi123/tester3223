import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Exercise the production unit conversion, without importing the JSX/modal runtime.
const source=readFileSync(new URL('../src/components/ChatActions.tsx',import.meta.url),'utf8');
const start=source.indexOf('function endConfirmationLayout(');
assert.notEqual(start,-1);
const end=source.indexOf('\nexport function ChatEndConfirmation',start);
const layout=Function(stripTypeScriptTypes(source.slice(start,end))+'; return endConfirmationLayout;')();
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} ≠ ${expected}`);

test('desktop confirmation keeps its existing345px presentation on both device presets',()=>{
  for(const width of [402,427])assert.deepEqual(layout(false,width,34,24),{scale:1,height:345,sourceHeight:345,bottomPadding:34});
});
test('native402 removes the mock home area while keeping source heading/action positions',()=>{
  const value=layout(true,402,34,0),top=780-value.height;
  assert.equal(value.height,311);assert.equal(value.sourceHeight,311);assert.equal(value.bottomPadding,0);
  assert.equal(top,469);assert.equal(top+40,509);assert.equal(top+173,642);assert.equal(top+245,714);
});
test('real safe area is added once below the native actions',()=>{
  const value=layout(true,402,34,34);
  assert.equal(value.height,345);assert.equal(value.bottomPadding,34);
  // Source second action ends at309, followed by2px and the physical safe area.
  assert.equal(value.sourceHeight-309,2+34);
});
test('native427 portal and outer402px fit cancel to the same physical source scale',()=>{
  const deviceWidth=427,zoom=402/deviceWidth,scale=deviceWidth/402;
  for(const physicalSafe of [0,34]){
    const value=layout(true,deviceWidth,34*scale,physicalSafe/zoom);
    close(value.scale*zoom,1);close(value.height*zoom,311+physicalSafe);
    close(value.bottomPadding*value.scale*zoom,physicalSafe);
    const top=780-value.height*zoom;
    close(top+40*value.scale*zoom,509-physicalSafe);
    close(top+173*value.scale*zoom,642-physicalSafe);
    close(top+245*value.scale*zoom,714-physicalSafe);
  }
});
