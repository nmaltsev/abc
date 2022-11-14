
FR: Add tooltip to all buttons
FR: change Popup title "About ABC …" => "Welcom guide to ABC … "
FR: show current line number in the header: <File name title>:<focus line>

```
// Escape unicode characters
/*str = str.replace(/([\u0080-\u0400\u04FF-\uFFFF])/g, function(s){
  var 	c = s.charCodeAt(0).toString(16), 
      i = 4 - c.length; 

  while(i-- > 0) c = '0' + c; 
  return '\\u' + c;
});*/
```

### An example of loading a resource inside js script
```
// This solution is working!
// Top level await is not supported. You need to wrap the code in IIF
(async function(){
await abc.load('https://cdnjs.cloudflare.com/ajax/libs/pako/1.0.6/pako.min.js');
console.dir(pako) ;
} ())
```

Colors for console or documentation
https://emailsignaturerescue.com/blog/best-regards-kind-regards-best-wishes-yours-sincerely-which-to-use-and-when
https://emailsignaturerescue.com/about/pricing
Background #3366c8

### alternatives
* https://chrome.google.com/webstore/detail/tedit-development-environ/ooekdijbnbbjdfjocaiflnjgoohnblgf
* https://github.com/creationix/tedit
* https://chrome.google.com/webstore/detail/exlcode-vs-code-based-onl/elcfpiphmolcddmecegalaikjiclhdjc?utm_source=chrome-ntp-icon
* https://jsitor.com/P1Br0ZbSF


Stackblitz
+ Cloudcentric - host all data at their space
+ can open window in separate window


### Get UID
```
uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  }
```


Profit from static analyzer is transforming the code:
  Change "" to '',
  rewrite object keys without quotas
