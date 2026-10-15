 function setAppVh(){document.documentElement.style.setProperty('--vh',(window.innerHeight*0.01)+'px')}
 setAppVh(); window.addEventListener('resize',setAppVh); window.addEventListener('orientationchange',setAppVh);
