(function() {
  "use strict";
  
  var
    // Form state
    form       = [],
    decorPos   = [false, false, false, false, false, false],
    attributes = [],
  
    // Cached data
    fileCache = [],
    personas  = [],
    
    // HTML elements
    proficiencyBox,
    bioBox,
    bioImg,
    bioTitle,
    bioText,
    bioTextWrapper;
  
  
    
  fileCache = [
    {
      filePath  : 'data/fields.json',
      cacheName : 'fields'
    },
    {
      filePath  : 'data/personas.json',
      cacheName : 'personas'
    },
    {
      filePath  : 'data/decor.json',
      cacheName : 'decor'
    }
  ];
  
  getJSONData();
  
  
  
  // Class
  function FormItem(attribute) {
    var
      i,
      ctx,
      mousedown = false;
    
    this.name         = attribute.name; // Primary key
    this.value        = attribute.value;
    this.potentialVal = false;
    this.decor        = attribute.decor;
    this.decorPos     = decorPos.indexOf(false);
    this.vDesc        = document.createElement('div');
    this.parent       = document.createElement('div');
    this.title        = document.createElement('h3');
    this.canvas       = document.createElement('canvas');
    this.removeIcon   = document.createElement('div');
    this.hPadding     = 20; // horizontal padding on canvas
    
    ctx = this.canvas.getContext('2d');
    
    this.parent.className = 'range';
    this.title.textContent = this.name;
    this.vDesc.className = 'value-description';
    this.removeIcon.className = 'remove-icon';
    this.removeIcon.textContent = 'X';
    
    this.parent.appendChild(this.title);
    this.parent.appendChild(this.canvas);
    this.parent.appendChild(this.vDesc);
    
    //this.title.appendChild(this.removeIcon);
    
    if (this.decor) {
      for (i = 0; i < this.decor.length; i++) {
        this.decor[i].elem = document.createElement('img');
        this.decor[i].elem.className = 'decor';
        this.decor[i].elem.src = 'images/decor/' + getDecorSrcFromName(this.decor[i].name);
        this.decor[i].elem.alt = this.name + '-themed decoration';
      }
    }
    
    
    this.add = function(DOMParent, cb) {
      var
        h = Math.floor(DOMParent.clientHeight / 3),
        self = this;
        
      //this.parent.style.height  = 0 + 'px';
      this.parent.style.opacity = 0;
      
      //this.size(h);
      
      DOMParent.appendChild(this.parent);
      
      changeDescription.call(this);
      this.render();
      
      stepHTML(this.parent, 'opacity', Date.now(), 350, 0, 1, function() {
        if (cb) { cb(); }
      });
      
      //stepHTML(this.parent, 'height', Date.now(), 700, 0, h, function(elem) {
      //  stepHTML(elem, 'opacity', Date.now(), 700, 0, 1);
      //});
    }
    
    this.size = function(height) {
      this.parent.style.height = height + 'px';
      
      this.title.style.fontSize = Math.floor(height * .2) + 'px';
      this.title.style.marginTop = Math.floor(height * .15) + 'px';
      
      this.canvas.height = Math.floor(height * .35);
      
      this.vDesc.style.fontSize = Math.min(Math.floor(height * .15), 14) + 'px';
    }
    
    this.changeValue = function(val) {
      var 
        i;
      
      this.value = val;
      changeDescription.call(this);
      
      if (this.decor && this.decorPos !== -1) {
        for (i = 0; i < this.decor.length; i++) {
          if (this.value >= this.decor[i].min
          || this.value <= this.decor[i].max) {
            
            if (!this.decor[i].shown) {
              this.decor[i].shown = true;
              this.showDecor(this.decor[i].elem);
            }
            
            //this.decor[i]
          } else {
            
            if (this.decor[i].shown) {
              this.decor[i].shown = false;
              this.hideDecor(this.decor[i].elem);
            }
            
          }
        }
      }
    }
    
    this.showDecor = function(decoration) {
      decoration.style.right = '-100%';
      decoration.style.bottom = '-100%';
      bioBox.parentNode.parentNode.parentNode.appendChild(decoration);
      
      setTimeout(function() {
        decoration.style.right = '5%';
        decoration.style.bottom = '5%';
      }, 100);
    }
    
    this.hideDecor = function(decoration) {
      decoration.style.right = '-100%';
      decoration.style.bottom = '-100%';
      
      setTimeout(function() {
        decoration.parentNode.removeChild(decoration);
      }, 1000);
    }
    
    this.remove = function(cb) {
      if (this.isBeingRemoved) { return; }
      
      var
        h = Math.round(this.parent.clientHeight),
        self = this;
      
      this.isBeingRemoved = true;
      decorPos[this.decorPos] = false;
      
      stepHTML(this.parent, 'opacity', Date.now(), 350, 1, 0, function(elem) {
        var
          i;
        
        elem.parentNode.removeChild(elem);
        for (i = 0; i < form.length; i++) {
          if (form[i].name === self.name) {
            form.splice(i, 1);
            break;
          }
        }
        
        if (cb) { cb(); }
      });
      
      /*
      stepHTML(this.parent, 'opacity', Date.now(), 700, 1, 0, function(elem) {
        stepHTML(elem, 'height', Date.now(), 700, h, 0, function(elem) {
          var
            i;
          
          elem.parentNode.removeChild(elem);
          for (i = 0; i < form.length; i++) {
            if (form[i].name === self.name) {
              form.splice(i, 1);
              break;
            }
          }
        });
      });
      */
    }
    
    function mouseDown(e) {
      var
        x = e.layerX,
        val;
        
      val = (x - this.hPadding) / (this.canvas.clientWidth - (2 * this.hPadding));
      val -= 0.5;
      val *= 2;
      
      val = Math.min(val, 1);
      val = Math.max(val, -1);
      
      mousedown = true;
      
      this.changeValue(val);
      changeDescription.call(this);
      this.render();
    }
    
    function mouseUp() {
      mousedown = false;
    }
    
    function mouseMove(e) {
      var
        x = e.layerX || e.touches[0].clientX,
        val;
      
      this.potentialVal = false;
      
      if (e.layerX) {
        val = (x - this.hPadding) / (this.canvas.clientWidth - (2 * this.hPadding));
      }
      
      // FIXME - fix this calculation
      if (e.touches) {
        val = (x / document.body.clientWidth) * ((this.canvas.clientWidth - (2 * this.hPadding)) / document.body.clientWidth);
      }
      
      val -= 0.5;
      val *= 2;
      
      val = Math.min(val, 1);
      val = Math.max(val, -1);
      
      this.potentialVal = val;
      
      if (mousedown) {
        this.changeValue(val);
      }
      
      this.render();
    }
    
    function mouseOut() {
      this.potentialVal = false;
      
      mousedown = false;
      
      changeDescription.call(this);
      this.render();
    }
    
    function changeDescription() {
      var
        i,
        text,
        descriptions;
      
      descriptions = [
        {
          min  : -1,
          text : 'Very weak'
        },
        {
          min  : -0.6,
          text : 'Somewhat weak'
        },
        {
          min  : -0.2,
          text : 'Fairly average'
        },
        {
          min  : 0.2,
          text : 'Somewhat strong'
        },
        {
          min  : 0.6,
          text : 'Very strong'
        }
      ];
      
      for (i = 0; i < descriptions.length; i++) {
        if (this.value >= descriptions[i].min) {
          text = descriptions[i].text;
        }
      }
      
      this.vDesc.textContent = text;
    }
    
    // Draw on the canvas
    this.render = function() {
      
      this.size(this.parent.parentNode.clientHeight / 3);
      
      var
        i,
        red   = 20,
        green = 20,
        color,
        bgColor = '#DDD',
        
        // Canvas dimensions and coordinates
        w       = this.canvas.clientWidth,
        h       = this.canvas.clientHeight,
        x       = w/2,
        y       = h/2,
        
        // Drawn element dimensions
        r       = Math.round(.2 * h),
        lineW   = Math.round(.2 * h),
        value;
      
      this.canvas.width  = w;
      this.canvas.height = h;
      
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = lineW;
      ctx.fillStyle = bgColor;
      
      // Background line of possible values
      ctx.beginPath();
      ctx.moveTo(this.hPadding, y);
      ctx.lineTo(w - this.hPadding, y);
      ctx.stroke();
      ctx.closePath();
      
      // Mouse hover effect
      if (typeof this.potentialVal === 'number') {
        value = x + ((x - this.hPadding) * this.potentialVal);
        makeMark(value, y, 2 * lineW, bgColor);
      }
      
      // Actual Value
      value = x + ((x - this.hPadding) * this.value);
      if (this.value < 0) { red = parseInt(red + (-190 * this.value)); }
      if (this.value > 0) { green = parseInt(green + (80 * this.value)); }
      color = 'rgba(' + red + ',' + green + ',10,.7)';
      
      ctx.save();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(value, y);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
      
      makeMark(value, y, 2 * lineW, 'white');
      makeMark(value, y, 2 * lineW, color);
      
      function makeMark(x, y, w, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - w);
        ctx.lineTo(x, y + w);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }
    
    // Step through an animation on an HTML element
    
    this.canvas.addEventListener('mousemove', mouseMove.bind(this));
    this.canvas.addEventListener('mousedown', mouseDown.bind(this));
    this.canvas.addEventListener('mouseout', mouseOut.bind(this));
    this.canvas.addEventListener('mouseup', mouseUp.bind(this));
    
    this.canvas.addEventListener('touchstart', mouseDown.bind(this));
    this.canvas.addEventListener('touchmove', mouseMove.bind(this));
    this.canvas.addEventListener('touchend', mouseUp.bind(this));
    this.canvas.addEventListener('touchcancel', mouseOut.bind(this));
    
    //this.removeIcon.addEventListener('click', this.remove.bind(this));
  }
  
  function getDecorSrcFromName(name) {
    var
      i,
      j;
    
    for (i = 0; i < fileCache.length; i++) {
      if (fileCache[i].cacheName === 'decor') {
        
        for (j = 0; j < fileCache[i].data.length; j++) {
          if (fileCache[i].data[j].name === name) {
            return fileCache[i].data[j].image;
          }
        }
        
        break;
      }
    }
    
    return false;
  }
  
  function changeProficiencies(newElems) {
    var
      child,
      elems = [];
    
    // Get existing proficiencies
    child = proficiencyBox.firstChild;
    while (child) {
      elems.push(child);
      child = child.nextSibling;
    }
    
    stepManyHTML(elems, 'opacity', Date.now(), 400, 1, 0, function(newElems) {
      newElems.forEach(function(elem) {
        elem.style.opacity = 0;
        proficiencyBox.appendChild(elem);
      });
      
      stepManyHTML(newElems, 'opacity', Date.now(), 400, 0, 1);
    });
  }
  
  
  
  // 
  function getJSONData() {
    var
      i,
      xhr;
    
    for (i = 0; i < fileCache.length; i++) {
      fileCache[i].loaded = false;
      xhr = new XMLHttpRequest();
      xhr.open('GET', fileCache[i].filePath, true);
      xhr.overrideMimeType('application/json');
      xhr.addEventListener('load', loadIntoCache.bind(xhr, i));
      xhr.send();
    }
  }
  
  function loadIntoCache(index) {
    fileCache[index].data   = JSON.parse(this.responseText);
    fileCache[index].loaded = true;
    init();
  }
  
  function init() {
    // Wait for files to load 
    for (var i = 0; i < fileCache.length; i++) {
      if (fileCache[i].loaded === false) { return; }
    }
    
    // DOM must be loaded
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    initPersonas();
    
    buildHTML();
    resize();
    window.addEventListener('resize', resize);
  }
  
  function initPersonas() {
    var
      i;
    
    for (i = 0; i < fileCache.length; i++) {
      if (fileCache[i].cacheName === 'personas') {
        personas = fileCache[i].data;
        return true;
      }
    }
    
    return false;
  }
  
  function resize() {
    var
      i,
      h;
      
    for (i = 0; i < form.length; i++) {
      //form[i].size(Math.round(form[i].parent.parentNode.clientHeight / 3));
      form[i].render();
    }
    
    h = bioBox.parentNode.clientHeight - 40;
    
    bioImg.style.height = h + 'px';
    
    bioTextWrapper.style.width = Math.floor(bioBox.parentNode.clientWidth - 61 - h) + 'px';
    bioTextWrapper.style.height = h + 'px';
  }
  
  function loadIdentity(index) {
    if (!index) { index = 0; }
    
    var
      i,
      j,
      elem,
      attributeInd;
    
    // TODO - change structure of attribute data
    //for (i = 0; i < personas[index].attributes)
    
    
    for (i = 0; i < form.length; i++) {
      attributeInd = -1;
      for (j = 0; j < personas[index].attributes.length; j++) {
        if (personas[index].attributes[j].name === form[i].name) {
          attributeInd = j;
          break;
        }
      }
      
      if (attributeInd === -1) {
        form[i].remove();
      } else {
        form[i].changeValue(personas[index].attributes[attributeInd].value);
        form[i].render();
        personas[index].attributes[attributeInd].doNotAdd = true;
      }
    }
    
    
    for (i = 0; i < personas[index].attributes.length; i++) {
      if (personas[index].attributes[i].doNotAdd) {
        personas[index].attributes[i].doNotAdd = false;
        continue;
      }
      
      form.push(new FormItem(personas[index].attributes[i]));
      form[form.length - 1].add(proficiencyBox);
    }
    
    
    bioImg.src = 'images/persona/' + personas[index].image;
    bioImg.alt = 'Portrait of ' + personas[index].name;
    bioImg.style.height = (bioBox.parentNode.clientHeight - 40) + 'px';
    
    
    bioTitle.textContent = personas[index].name;
    
    bioText.textContent = personas[index].bio;
  }
  
  function openPersonaSelectionMenu() {
    var
      i,
      screen,
      container,
      item,
      elem;
      
    screen = document.createElement('div');
    screen.className = 'screen';
    document.body.appendChild(screen);
    
    container = document.createElement('div');
    container.className = 'container';
    screen.appendChild(container);
    
    elem = document.createElement('h2');
    elem.textContent = 'SELECT A PERSONA';
    container.appendChild(elem);
    
    for (i = 0; i < personas.length; i++) {
      item = document.createElement('div');
      item.className = 'item';
      container.appendChild(item);
      item.addEventListener('click', selectPersona.bind(null, i, screen));
      
      elem = document.createElement('img');
      elem.src = 'images/persona/' + personas[i].image;
      elem.alt = 'Portrait image of ' + personas[i].name;
      item.appendChild(elem);
      
      elem = document.createElement('p');
      elem.textContent = personas[i].name;
      item.appendChild(elem);
    }
    
    elem = document.createElement('div');
    elem.className = 'button';
    elem.textContent = 'Cancel';
    container.appendChild(elem);
    elem.addEventListener('click', closePersonaSelectionMenu.bind(null, screen));
  }
  
  function closePersonaSelectionMenu(elem) {
    elem.parentNode.removeChild(elem);
  }
  
  function selectPersona(index, screen) {
    loadIdentity(index);
    closePersonaSelectionMenu(screen);
  }
  
  function buildHTML() {
    var
      desk,
      container,
      block,
      elem,
      tab1,
      tab2,
      tab3,
      tab4,
      uiBlock;
    
    // Remove any existing html
    while (document.body.firstChild) { document.body.removeChild(document.body.firstChild); }
    
    desk = document.createElement('div');
    desk.className = 'desk';
    document.body.appendChild(desk);
    
    container = document.createElement('div');
    container.className = 'container';
    desk.appendChild(container);
    
    // Title
    block = document.createElement('h1');
    block.textContent = 'Persona';
    block.className = 'title';
    container.appendChild(block);
    
    elem = document.createElement('span');
    elem.textContent = 'PREMADE';
    block.appendChild(elem);
    elem.addEventListener('click', openPersonaSelectionMenu);
    
    // Proficiencies
    uiBlock = document.createElement('div');
    uiBlock.className = 'ui-block range';
    container.appendChild(uiBlock);
    
    tab1 = document.createElement('div');
    tab1.className = 'tab active';
    tab1.textContent = 'Academics';
    uiBlock.appendChild(tab1);
    
    tab2 = document.createElement('div');
    tab2.className = 'tab';
    tab2.textContent = 'Background';
    uiBlock.appendChild(tab2);
    
    tab3 = document.createElement('div');
    tab3.className = 'tab';
    tab3.textContent = 'Interests';
    uiBlock.appendChild(tab3);
    
    tab4 = document.createElement('div');
    tab4.className = 'tab';
    tab4.textContent = 'Learning';
    uiBlock.appendChild(tab4);
    
    tab1.addEventListener('click', function() {
      tab1.className = 'tab active';
      tab2.className = 'tab';
      tab3.className = 'tab';
      tab4.className = 'tab';
    });
    
    tab2.addEventListener('click', function() {
      tab1.className = 'tab';
      tab2.className = 'tab active';
      tab3.className = 'tab';
      tab4.className = 'tab';
    });
    
    tab3.addEventListener('click', function() {
      tab1.className = 'tab';
      tab2.className = 'tab';
      tab3.className = 'tab active';
      tab4.className = 'tab';
    });
    
    tab4.addEventListener('click', function() {
      tab1.className = 'tab';
      tab2.className = 'tab';
      tab3.className = 'tab';
      tab4.className = 'tab active';
    });
    
    proficiencyBox = document.createElement('div');
    uiBlock.appendChild(proficiencyBox);
    
    // Bio
    uiBlock = document.createElement('div');
    uiBlock.className = 'ui-block bio';
    container.appendChild(uiBlock);
    
    bioBox = document.createElement('div');
    uiBlock.appendChild(bioBox);
    
    bioImg = document.createElement('img');
    bioBox.appendChild(bioImg);
    
    bioTextWrapper = document.createElement('div');
    bioTextWrapper.className = 'text';
    bioBox.appendChild(bioTextWrapper);
    
    bioTitle = document.createElement('b');
    bioTextWrapper.appendChild(bioTitle);
    
    bioText = document.createElement('p');
    bioTextWrapper.appendChild(bioText);
    
    loadIdentity();
  }
  
  function stepHTML(elem, style, startTime, duration, startVal, endVal, callback) {
    var
      t    = Date.now(),
      coef = Math.sin((Math.PI / 2) * (t - startTime) / duration),
      val  = startVal + (endVal - startVal) * coef;
    
    if (t > startTime + duration) {
      val = endVal;
      if (typeof callback === 'function') {
        callback(elem);
      }
    } else {
      window.requestAnimationFrame(
        stepHTML.bind(null, elem, style, startTime, duration, startVal, endVal, callback)
      );
    }
    
    switch(style) {
      case 'height':
        val += 'px';
        break;
    }
    
    elem.style[style] = val;
  }
  
  function stepManyHTML(elems, style, startTime, duration, startVal, endVal, callback) {
    var
      i,
      t    = Date.now(),
      coef = Math.sin((Math.PI / 2) * (t - startTime) / duration),
      val  = startVal + (endVal - startVal) * coef;
      
    if (t > startTime + duration) {
      val = endVal;
      if (typeof callback === 'function') { callback(elems); }
    } else {
      window.requestAnimationFrame(
        stepManyHTML.bind(null, elems, style, startTime, duration, startVal, endVal, callback)
      );
    }
    
    switch(style) {
      case 'height':
        val += 'px';
        break;
    }
    
    elems.forEach(function(elem) {
      elem.style[style] = val;
    });
  }
  
})();