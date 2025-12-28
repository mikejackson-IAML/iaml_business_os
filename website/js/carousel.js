// Logo Carousel - Simple version with no syntax issues
(function() {
  'use strict';

  function initLogoCarousel() {
    const container = document.querySelector('.logo-carousel-container');
    if (!container) {
      console.warn('Logo carousel container not found');
      return;
    }

    const logos = [
      { name: 'Apple', url: 'https://i.imgur.com/FuNDbON.png' },
      { name: 'Google LLC', url: 'https://i.imgur.com/P6DGaGC.png' },
      { name: 'Microsoft Corporation', url: 'https://i.imgur.com/0v42wa7.png' },
      { name: 'Amazon.com, Inc.', url: 'https://i.imgur.com/B6wFaBN.png' },
      { name: 'Meta Platforms', url: 'https://i.imgur.com/fMP8sge.png' },
      { name: 'JPMorgan Chase & Co.', url: 'https://i.imgur.com/h7T5tLc.png' },
      { name: 'Bank of America', url: 'https://i.imgur.com/2A6O0Kj.png' },
      { name: 'Exxon Mobil Corporation', url: 'https://i.imgur.com/RgMgCaC.png' },
      { name: 'Ford Motor Company', url: 'https://i.imgur.com/lRiu1J1.png' },
      { name: 'Dell Technologies', url: 'https://i.imgur.com/cujuGK4.png' },
      { name: 'Oracle Corporation', url: 'https://i.imgur.com/RGaBYjo.png' },
      { name: 'Tesla, Inc.', url: 'https://i.imgur.com/S6g8xZJ.png' },
      { name: 'Abbott Laboratories', url: 'https://i.imgur.com/8LLjRA7.png' },
      { name: '3M', url: 'https://i.imgur.com/2cG0jab.png' },
      { name: 'Accenture', url: 'https://i.imgur.com/VmauYym.png' },
      { name: 'Comcast Corporation', url: 'https://i.imgur.com/IbYJWed.png' },
      { name: 'Valero Energy Corporation', url: 'https://i.imgur.com/JdXOBCi.png' },
      { name: 'adidas', url: 'https://i.imgur.com/Lgx6vKd.png' },
      { name: 'Activision Blizzard, Inc.', url: 'https://i.imgur.com/ZjLDvby.png' },
      { name: 'Advanced Micro Devices, Inc. (AMD)', url: 'https://i.imgur.com/pGLNJ4Q.png' },
      { name: 'Starbucks', url: 'https://i.imgur.com/EvMrsx6.png' },
      { name: 'Nike', url: 'https://i.imgur.com/5muWsfv.png' },
      { name: 'McDonalds', url: 'https://i.imgur.com/aF0WZlA.png' },
      { name: 'IBM', url: 'https://i.imgur.com/T4gCElR.png' },
      { name: 'Johnson & Johnson', url: 'https://i.imgur.com/XOwIELS.png' },
      { name: 'Pfizer', url: 'https://i.imgur.com/RvuLQIz.png' },
      { name: 'Walt Disney Company', url: 'https://i.imgur.com/4sQq9Om.png' },
      { name: 'PepsiCo', url: 'https://i.imgur.com/gSE9jtq.png' },
      { name: 'Coca-Cola', url: 'https://i.imgur.com/fNnedBN.png' },
      { name: 'Procter & Gamble', url: 'https://i.imgur.com/MiqBKnH.png' },
      { name: 'Harvard University', url: 'https://i.imgur.com/Cxr8JMW.png' },
      { name: 'Stanford University', url: 'https://i.imgur.com/jukkKXl.png' },
      { name: 'Johns Hopkins University', url: 'https://i.imgur.com/4Nn0c9F.png' }
    ];

    function shuffleArray(array) {
      const arr = array.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const buf = new Uint32Array(1);
        window.crypto.getRandomValues(buf);
        const j = Math.floor((buf[0] / 0x100000000) * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    }

    function buildHTML(logoList) {
      let html = '<div class="logo-scroll">';
      
      for (let i = 0; i < logoList.length; i++) {
        html += '<div class="logo-item">';
        html += '<img width="220" height="140" loading="lazy" decoding="async" ';
        html += 'src="' + logoList[i].url + '" ';
        html += 'alt="' + logoList[i].name + '">';
        html += '</div>';
      }
      
      for (let i = 0; i < logoList.length; i++) {
        html += '<div class="logo-item">';
        html += '<img width="220" height="140" loading="lazy" decoding="async" ';
        html += 'src="' + logoList[i].url + '" ';
        html += 'alt="' + logoList[i].name + '">';
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }

    const shuffled = shuffleArray(logos);
    container.innerHTML = buildHTML(shuffled);

    const track = container.querySelector('.logo-scroll');
    if (track) {
      const style = getComputedStyle(document.documentElement);
      const speedValue = style.getPropertyValue('--carousel-speed');
      const duration = parseFloat(speedValue) || 70;
      const offset = Math.random() * duration;
      track.style.animationDelay = '-' + offset + 's';
      
      console.log('Logo carousel initialized with ' + logos.length + ' logos');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoCarousel);
  } else {
    initLogoCarousel();
  }

})();
