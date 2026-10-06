(function(){
  'use strict';

  var mount = document.getElementById('portfolioLoaderMount');
  if(!mount) return;

  fetch('loader.html')
    .then(function(response){
      if(!response.ok) throw new Error('Loader markup unavailable');
      return response.text();
    })
    .then(function(markup){
      mount.innerHTML = markup;
      var loader = mount.querySelector('#portfolioLoader');
      var products = Array.prototype.slice.call(mount.querySelectorAll('[data-loader-product]'));
      var progressBar = mount.querySelector('#loaderProgressBar');
      var percentLabel = mount.querySelector('#loaderPercent');
      var statusLabel = mount.querySelector('#loaderStatus');
      if(!loader || !products.length || !progressBar || !percentLabel || !statusLabel){
        mount.remove();
        return;
      }

      var statuses = ['BUILDING MOBILE EXPERIENCES','CRAFTING WEB INTERFACES','DESIGNING PRODUCT SYSTEMS'];
      var duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 450 : 4800;
      var startTime = Date.now();
      var progressTimer;

      function renderLoader(){
        var progress = Math.min((Date.now() - startTime) / duration, 1);
        var percent = Math.round(progress * 100);
        var activeIndex = Math.min(products.length - 1, Math.floor(progress * products.length));
        progressBar.style.width = percent + '%';
        percentLabel.textContent = percent + '%';
        statusLabel.textContent = statuses[activeIndex];
        products.forEach(function(product,index){
          product.classList.toggle('active', index === activeIndex);
        });

        if(progress < 1) return;

        window.clearInterval(progressTimer);
        window.setTimeout(function(){
          loader.classList.add('is-complete');
          window.setTimeout(function(){ mount.remove(); }, 950);
        }, 180);
      }

      progressTimer = window.setInterval(renderLoader, 40);
      renderLoader();
    })
    .catch(function(){ mount.remove(); });
})();
