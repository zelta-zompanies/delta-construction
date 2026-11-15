// Execute the actual production form-binding block with mocked DOM/network.
// No real messages are sent.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('script.js', 'utf8');
const start = source.indexOf('  document.querySelectorAll("form[data-delta-form]")');
const end = source.indexOf('\n  });', start) + '\n  });'.length;
async function run(outcome) {
  let submit, posts=0, resets=0, events=0;
  const status={}, button={textContent:'Send',disabled:false,querySelector:()=>null,classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){}};
  const fields=[{value:'Test',required:true,disabled:false,setCustomValidity(){},addEventListener(){}}];
  const form={dataset:{},querySelector:s=>s==='.form-status'?status:button,
    querySelectorAll:()=>fields,addEventListener:(name,fn)=>{if(name==='submit')submit=fn;},
    reportValidity:()=>true,setAttribute(){},removeAttribute(){},reset(){resets++;},getAttribute:()=> 'contact'};
  const window={setTimeout,clearTimeout};
  vm.runInNewContext(source.slice(start,end),{document:{querySelectorAll:()=>[form]},window,
    URLSearchParams, FormData:class {constructor(){return [['form-name','contact'],['name','Test']];}},
    AbortController, trackEvent:()=>events++,fetch:async()=>{posts++;if(outcome==='error')throw Error('network');return {ok:outcome===200};}});
  await submit({preventDefault(){}});
  assert.equal(posts,1);assert.equal(fields[0].disabled,false);
  if(outcome===200){assert.equal(resets,1);assert.equal(events,1);assert.equal(button.disabled,true);assert.match(status.textContent,/submitted/);}
  if(outcome===500){assert.equal(resets,0);assert.equal(events,0);assert.equal(button.disabled,false);assert.match(status.textContent,/not accepted/);}
  if(outcome==='error'){assert.equal(resets,0);assert.equal(events,0);assert.equal(button.disabled,true);assert.match(status.textContent,/couldn't confirm/);}
  if(outcome!==500){await submit({preventDefault(){}});assert.equal(posts,1);}
}
(async()=>{for(const outcome of [200,500,'error'])await run(outcome);console.log('PASS: actual form handler success, server rejection, uncertain network outcome, input retention and duplicate protection');})();
