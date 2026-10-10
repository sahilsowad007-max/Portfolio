(function(){
  'use strict';

  var mount = document.getElementById('portfolioLoaderMount');
  if(!mount) return;

  function initLoader(loader){
    var stage = loader.querySelector('#loader3dStage');
    var layers = Array.prototype.slice.call(loader.querySelectorAll('[data-loader-layer]'));
    var progressBar = loader.querySelector('#loaderProgressBar');
    var percentLabel = loader.querySelector('#loaderPercentNum');
    var statusLabel = loader.querySelector('#loaderStatusMsg');
    var phaseLabel = loader.querySelector('#loaderPhaseTag');
    var skipBtn = loader.querySelector('#loaderSkipBtn');

    if(!progressBar || !percentLabel || !statusLabel){
      cleanup();
      return;
    }

    var phases = [
      { num: 'PHASE 01 / 03', text: 'COMPOSING UX ARCHITECTURE' },
      { num: 'PHASE 02 / 03', text: 'SYNTHESIZING UI SYSTEMS' },
      { num: 'PHASE 03 / 03', text: 'FINALIZING PRODUCT EXPERIENCE' }
    ];

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var duration = prefersReduced ? 350 : 3600; // 3.6s duration giving ~1.2s per 3D phase
    var startTime = Date.now();
    var progressTimer = null;
    var rafTiltId = null;
    var isDone = false;

    /* ---------- 3D Interactive Pointer Parallax ---------- */
    var targetTiltX = 0, targetTiltY = 0;
    var currentTiltX = 0, currentTiltY = 0;

    function onPointerMove(e){
      if(!stage) return;
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      var normX = (e.clientX - cx) / Math.max(cx, 1);
      var normY = (e.clientY - cy) / Math.max(cy, 1);
      targetTiltX = -normY * 16; // Pitch tilt
      targetTiltY = normX * 22;  // Yaw rotation
    }

    function tiltLoop(){
      if(isDone) return;
      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;
      if(stage){
        stage.style.setProperty('--tilt-x', currentTiltX.toFixed(2) + 'deg');
        stage.style.setProperty('--tilt-y', currentTiltY.toFixed(2) + 'deg');
      }
      rafTiltId = requestAnimationFrame(tiltLoop);
    }

    if(!prefersReduced && stage){
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      rafTiltId = requestAnimationFrame(tiltLoop);
    }

    /* ---------- Smooth Exit & Handoff ---------- */
    function cleanup(){
      if(isDone) return;
      isDone = true;

      if(progressTimer) clearInterval(progressTimer);
      if(rafTiltId) cancelAnimationFrame(rafTiltId);
      window.removeEventListener('pointermove', onPointerMove);

      document.documentElement.classList.remove('is-loading');
      document.body.classList.remove('is-loading');

      loader.classList.add('is-complete');
      window.dispatchEvent(new CustomEvent('portfolioLoaderComplete'));

      window.setTimeout(function(){
        if(mount && mount.parentNode){
          mount.parentNode.removeChild(mount);
        }
      }, 800);
    }

    /* ---------- Progress Animation Loop ---------- */
    function renderLoader(){
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var percent = Math.round(progress * 100);

      progressBar.style.width = percent + '%';
      percentLabel.textContent = percent + '%';

      var activeIndex = Math.min(layers.length - 1, Math.floor(progress * layers.length));
      if(progress >= 0.98){
        if(phaseLabel) phaseLabel.textContent = 'READY';
        statusLabel.textContent = 'EXPERIENCE READY';
      } else {
        if(phaseLabel && phases[activeIndex]) phaseLabel.textContent = phases[activeIndex].num;
        if(statusLabel && phases[activeIndex]) statusLabel.textContent = phases[activeIndex].text;
      }

      layers.forEach(function(layer, idx){
        layer.classList.toggle('active', idx === activeIndex);
      });

      if(progress >= 1){
        clearInterval(progressTimer);
        window.setTimeout(cleanup, 120);
      }
    }

    /* ---------- User Controls: Skip Button, Keys & Click ---------- */
    if(skipBtn){
      skipBtn.addEventListener('click', function(e){
        e.stopPropagation();
        cleanup();
      });
    }

    // Clicking anywhere on loader dismisses cleanly
    loader.addEventListener('click', function(e){
      cleanup();
    });

    window.addEventListener('keydown', function(e){
      if(e.key === 'Escape' || e.key === ' ' || e.key === 'Enter'){
        cleanup();
      }
    }, { once: true });

    progressTimer = setInterval(renderLoader, 30);
    renderLoader();
  }

  /* Pre-mounted markup support + fetch fallback */
  var existingLoader = mount.querySelector('#portfolioLoader');
  if(existingLoader){
    initLoader(existingLoader);
  } else {
    fetch('loader.html')
      .then(function(res){
        if(!res.ok) throw new Error('Loader markup missing');
        return res.text();
      })
      .then(function(html){
        mount.innerHTML = html;
        var loader = mount.querySelector('#portfolioLoader');
        if(!loader){
          document.documentElement.classList.remove('is-loading');
          document.body.classList.remove('is-loading');
          if(mount.parentNode) mount.parentNode.removeChild(mount);
          return;
        }
        initLoader(loader);
      })
      .catch(function(){
        document.documentElement.classList.remove('is-loading');
        document.body.classList.remove('is-loading');
        if(mount.parentNode) mount.parentNode.removeChild(mount);
      });
  }
})();
