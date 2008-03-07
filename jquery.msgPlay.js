// jQuery 1.2.3 plugin by bootleq@gmail.com 2008-03-06

(function($) {

var ver = '0.01';

$.fn.msgPlay = function(options) {
  return this.each(function() {

    options = $.extend( {}, $.fn.msgPlay.defaults, options );

    // pages: 只在第一層 children 中尋找
    var pages = options.pageExpr ? $(this).children(options.pageExpr) : $(this);
    if(!pages.length) { return; }
    if( options.removeUnused && options.pageExpr ) { $(this).children().not(options.pageExpr).remove(); }
    
    // 清除上次套用 $.fn.msgPlay 的效果
    if( $.data(this,'_msgPlay_last') && $.isFunction($.data(this,'_msgPlay_last').clearLast) ) {
      $.data( this, '_msgPlay_last' ).clearLast();
    };
    // 將 data 存入元素以待下次 $.fn.msgPlay 使用 
    $.data( this, '_msgPlay_last', {
      clearLast: function() {
        clearLast( options, pages );
      }
    });

    // 在原本就隱藏的元素上作記號
    if( options.keepInvisible ) {
      pages.find(':not(:visible)').each( function(i,elem) {
        $.data( elem, '_msgPlay_invisible', true );
      });
    }
    
    pages.hide();
    
    options.pageCurrent = 0;    // 目前所在頁數
    options.playTimeout = 0;    // 用於下一次 play()
    options.queueLocks = [];    // 因 queue 而鎖住的元素， play 會在此中斷
    options.pauseLocks = [];    // 因 pause 而鎖住的元素， play 會在此中斷
    options.parentStack = [];   // 走訪子節點時，儲存父節點以備返回
    options.buffer = [];        // 儲存文字節點的內容
    
    options.playedPages = [];    // 記錄已播過的頁面
    if(!options.dump) { options.dump = 'back'; }

    markCustom( pages, options );
    
    $(this).show();
    if( options.dump == 'all' ) { page_dump( options.pageCurrent, options, pages ); }
    else { page( options.pageCurrent, options, pages ); }
    
    // 控制按鈕
    if( options.forward ) {
      if( !$(options.forward).length ) {  // 找不到的元素的話，就自己建立
        options.forward = document.createElement('span');
        $(options.forward).css({'float':'right','cursor':'pointer'}).html('[FORWARD]').appendTo(this);
      }
      $(options.forward).bind( 'click', {options:options,pages:pages}, forward );
    }
    if( options.back ) {
      if( !$(options.back).length ) {
        options.back = document.createElement('span');
        $(options.back).css({'float':'right','cursor':'pointer'}).html('[BACK]').appendTo(this);
      }
      $(options.back).hide().bind( 'click', {options:options,pages:pages}, back );
    }
    if( options.next ) {
      if( !$(options.next).length ) {
        options.next = document.createElement('span');
        $(options.next).css({'float':'right','cursor':'pointer'}).html('[NEXT PAGE]').appendTo(this);
      }
      $(options.next).hide().bind( 'click', {options:options,pages:pages}, next );
    }
    
  });
};


// play 前準備

// 對符合 options.act expr 的 element 寫入資料
function markCustom( pages, options ) {
  for( i in options.act ) {
    pages.find( options.act[i][0] ).each( function(j,elem) {
      if( $.data(elem, '_msgPlay_custom') && $.data(elem, '_msgPlay_custom').constructor==Array ) {
        $.data( elem, '_msgPlay_custom', $.data(elem, '_msgPlay_custom').concat(i) );
      }
      else {
        $.data( elem, '_msgPlay_custom', [i] );   // 存一個 index
      }
      if( typeof(options.act[i][2])=='string' ) {    // i[2]: option
        $.data( elem, '_msgPlay_custom_option', options.act[i][2] );
      }
    });
  }
}
// 由第一個子節點開始，隱藏所有可見的子節點。若是文字節點，把文字備份到 options.buffer 後設為空字串
function hideContents( elem, options ) {
  if( elem.nodeType == 3 ) {
    if( !textData(options.buffer, elem) ) {
      textData( options.buffer, elem, (options.trimText) ? $.trim(elem.nodeValue) : elem.nodeValue );
    }
    elem.nodeValue = '';
    if(elem.nextSibling) { hideContents(elem.nextSibling, options); }
  }
  else if( elem.nodeType == 1 ) {
    $(elem).hide();
    if( elem.hasChildNodes() ) { hideContents(elem.firstChild, options); }
    if(elem.nextSibling) { hideContents(elem.nextSibling, options); }
  }
  else { if(elem.nextSibling) { hideContents(elem.nextSibling, options); } }
};


// 內部用到的函數

// 停止 play 的走訪，並重設相關參數
function stop( options ) {
  if( options.playTimeout ) { clearTimeout( options.playTimeout ); }
  options.isForward = false;
  options.pauseElem = null;
  options.queueLocks = [];
  options.pauseLocks = [];
  options.parentStack = [];
};
// 清除上次套用 $.fn.msgPlay 的效果
function clearLast( options, pages ) {
  $(options.forward).unbind( 'click', forward );
  $(options.back).unbind( 'click', back );
  $(options.next).unbind( 'click', next );
  if( options.playTimeout ) { clearTimeout( options.playTimeout ); }
  options = null;
  pages.show().find('*').each( function(i,elem) {
    $.removeData( elem, '_msgPlay_custom' );
    $.removeData( elem, '_msgPlay_custom_option' );
    if( $.data( elem, '_msgPlay_invisible') ) {
      $(elem).hide();
      $.removeData( elem, '_msgPlay_invisible');
    }
    else { $(elem).show(); }
  });
  pages = null;
};
// 存取 options.buffer （管理所有文字節點的內容）
function textData( buffer, elem, data ) {
  for( i in buffer ) {
    if( buffer[i][0] == elem ) {
      if(data) { buffer[i][1] = data; return; }
      else return buffer[i][1];
    }
  }
  if(data) buffer.push( [elem,data] );
};


// 開始播放頁面

// 跳至 pages[index] 逐字播放
function page( index, options, pages ) {
  if( options.dump == 'used' ) { 
    if( $.inArray(index,options.playedPages) > -1 ) { page_dump( index,options,pages); return; }
    else options.playedPages.push(index);
  }

  $(pages[options.pageCurrent]).hide();
  stop(options);
  
  options.status = 'play';
  options.pageCurrent = index;
  
  hideContents( pages[options.pageCurrent].firstChild, options );
  if($.isFunction(options.onPageStart)) { options.onPageStart(); }
  $(pages[options.pageCurrent]).show();
  play( pages[options.pageCurrent].firstChild, options, pages );
  if(options.forward) $(options.forward).show();
  if(options.next) $(options.next).hide();
  if(options.back) {
    if( index > 0 ) { $(options.back).show(); }
    else { $(options.back).hide(); }
  }
};
// 跳至 pages[index] 並直接顯示內容
function page_dump( index, options, pages ) {
  $(pages[options.pageCurrent]).hide();
  stop(options);
  
  options.status = 'page';
  options.pageCurrent = index;
  
  if($.isFunction(options.onPageDump)) { options.onPageDump(); }
  $(pages[options.pageCurrent]).show();
  
  endOfPage( options, pages );
  if(options.back) {
    if( index > 0 ) { $(options.back).show(); }
    else { $(options.back).hide(); }
  }
};


// 依序處理 DOM 元素

// 逐字播放，特別用於處理文字節點
function playText( elem, text, options, pages ) {
  if( options.isForward ) {
    elem.nodeValue = text;
  }
  else if( elem.nodeValue.length < text.length ) {
    elem.nodeValue += text.substr( elem.nodeValue.length, 1 );
    //opera.postError( elem.nodeValue );
    if( elem.nodeValue.length < text.length ) {
      options.playTimeout = setTimeout( function(){playText(elem, text, options, pages);}, options.speed );
      return;
    }
  }
  if(elem.nextSibling) { play( elem.nextSibling, options, pages ); }
  else if(options.parentStack.length) { play( options.parentStack.pop(), options, pages ); }
  else { endOfPage(options, pages); }
};
// play() 處理所有元素
function play( elem, options, pages ) {

  // 元素被設為鎖住，中斷
  if( $.inArray(elem,options.queueLocks) > -1 || $.inArray(elem,options.pauseLocks) > -1 ) {
    options.status = 'pause';
    //debugger;
    options.pauseElem = elem;
    return;
  }
  
  // 1. text node: 流程移至 playText()
  if( elem.nodeType == 3 ) {
    if( tData = textData( options.buffer, elem ) ) {
      if( options.elemSpeed && !options.isForward ) {
        options.playTimeout = setTimeout( function(){playText(elem, tData, options, pages);}, options.elemSpeed );
      }
      else {
        playText( elem, tData, options, pages );
      }
    }
    else { playText( elem, '', options, pages ); }
  }
  
  // 2. element node
  else if( elem.nodeType == 1 ) {
    
    // 找出下一個元素 （nextElem）
    var nextElem = elem;
    if( elem.hasChildNodes() ) {
      nextElem = elem.firstChild;
      if( elem.nextSibling ) { options.parentStack.push(elem.nextSibling); }
    }
    else if( elem.nextSibling ) {
      nextElem = elem.nextSibling;
    }
    else if( options.parentStack.length ) {
      nextElem = options.parentStack.pop();
    }
    else {  // 已經沒有 nextElem 了
      nextElem = null;
    }

    // 元素設有 act, 執行它的 callback 函數
    if($.data(elem,'_msgPlay_custom')) {
      for( i in $.data(elem,'_msgPlay_custom') ) {
        var custom = options.act[ $.data(elem,'_msgPlay_custom')[i] ];  // custom: [expr, callback, option]
        if( typeof(custom[1])!='function' ) {
          if( typeof(custom[1])=='string' && $.isFunction($.fn.msgPlay.actFns[custom[1]]) ) {
            custom[1] = $.fn.msgPlay.actFns[custom[1]];
          }
          else {
            custom[1] = function(){return;};
          }
        }
        custom[1].apply(this,arguments);
      }
    }
    
    // 元素 act 設有 option （pause 或 queue）
    if( ($.data(elem, '_msgPlay_custom_option')) ) {

      var lastLocked = null;  // 要鎖住的元素
      
      switch($.data(elem, '_msgPlay_custom_option')) {
        
        case 'pause':
            if( elem.nextSibling ) { lastLocked = elem.nextSibling; }
            else if( options.parentStack.length > 0 ) {
              lastLocked = options.parentStack[options.parentStack.length-1];
            }
            options.pauseLocks.push(lastLocked);
            
            if( !$(elem).data('_msgPlay_invisible') ) { $(elem).show(); }
            if( nextElem ) { options.playTimeout = setTimeout( function(){play(nextElem, options, pages);}, options.elemSpeed||0 ); }
            return;
        
        case 'queue':
            if( elem.nextSibling ) { lastLocked = elem.nextSibling; }
            else if( options.parentStack.length > 0 ) {
              lastLocked = options.parentStack[options.parentStack.length-1];
            }
            options.queueLocks.push(lastLocked);
            
            $(elem).queue(function() {    // 元素效果結束後 
              if( jQuery.inArray(lastLocked,options.queueLocks) > -1 ) {   // 要解鎖
                options.queueLocks.splice( jQuery.inArray(lastLocked,options.queueLocks), 1 );
              }
              if( options.pauseElem == lastLocked  ) {   // 若正停止於此元素，播放
                play( lastLocked, options, pages );
              }
              jQuery(this).dequeue();
            });
            
            if( !$(elem).data('_msgPlay_invisible') ) { $(elem).show(); }
            if( nextElem ) {
              if( options.isForward ) { play( nextElem, options, pages ); }
              else { options.playTimeout = setTimeout( function(){play(nextElem, options, pages);}, options.elemSpeed||0 ); }
            }
            return;
        
        default:
            if( !$(elem).data('_msgPlay_invisible') ) { $(elem).show(); }
            if( nextElem ) {
              if( options.isForward ) { play( nextElem, options, pages ); }
              else { options.playTimeout = setTimeout( function(){play(nextElem, options, pages);}, options.elemSpeed||0 ); }
            }
            return;
      };
    }
    else {  // 元素 act 沒有 option，正常播放
      if( !$(elem).data('_msgPlay_invisible') ) { $(elem).show(); }
      if( nextElem ) {
        if( options.isForward ) { play( nextElem, options, pages ); }
        else { options.playTimeout = setTimeout( function(){play(nextElem, options, pages);}, options.elemSpeed||0 ) };
      }
    }
    
    if( !nextElem ) {
      endOfPage(options, pages);
      return;
    }
    
  }

  // 其他的 nodeType
  else {
    if(elem.nextSibling) { play( elem.nextSibling, options, pages ); }
    else if( options.parentStack.length ) { play( options.parentStack.pop(), options, pages ); }
    else return endOfPage(options, pages);
  }

};



// 分頁控制

function forward(e) {
  options = e.data.options;
  pages = e.data.pages;
  switch (options.status) {
    case 'play':
        options.isForward = true;
        if($.isFunction(options.onForward)) { options.onForward(); }
        return;
    case 'pause':
        options.isForward = false;
        options.status = 'play';
        if( options.pauseElem == options.pauseLocks[options.pauseLocks.length-1] ) {   // 需要解鎖
          options.pauseLocks.pop();
          play( options.pauseElem, options, pages );
        }
        return;
    case 'page':
        if( options.pageCurrent + 1 < pages.length ) {
          next(e);
        }
        return;
    default:
        return;
  };
};
function back(e) {
  options = e.data.options;
  pages = e.data.pages;
  if( options.pageCurrent > 0 ) {
    switch (options.dump) {
      case 'none':
          page( options.pageCurrent - 1, options, pages );
          return;
      case 'used':
          if( $.inArray(options.pageCurrent-1,options.playedPages)<0 ) {  // 還沒播過
            page( options.pageCurrent - 1, options, pages );
            return;
          }
      case 'back':
      case 'all':
      default:
          page_dump( options.pageCurrent - 1, options, pages );
          return;
    }
  }
};
function next(e) {
  options = e.data.options;
  pages = e.data.pages;
  if( options.pageCurrent + 1 < pages.length ) {
    switch (options.dump) {
      case 'all':
          page_dump( options.pageCurrent + 1, options, pages );
          return;
      case 'used':
          if( $.inArray(options.pageCurrent+1,options.playedPages)>-1 ) {  // 還沒播過
            page_dump( options.pageCurrent + 1, options, pages );
            return;
          }
      case 'back':
      case 'none':
      default:
          page( options.pageCurrent + 1, options, pages );
          return;
    }
  }
};
function endOfPage(options, pages) {
  options.isForward = false;
  options.status = 'page';
  if( options.pageCurrent + 1 < pages.length ) {
    if(options.forward) $(options.forward).show();
    if(options.next) $(options.next).show();
  }
  else {
    if(options.forward) $(options.forward).hide();
    if(options.next) $(options.next).hide();
  }
};


// 可以在此自訂 callback name 以用於 act: [ expr, callback name, option ]
// 例如：    act: [ ['p', 'ex', 'pause'] ]
$.fn.msgPlay.actFns = {
  ex: function( elem, options, pages ) {
    if (window.console && window.console.log) {
      window.console.log( "msgPlay act callback 'ex' at: %o", elem );
    }
  }
};

$.fn.msgPlay.ver = function() { return ver; };

$.fn.msgPlay.defaults = {
  speed: 70,              // 文字播放速度（每多少 ms 播一個字）
  elemSpeed: null,        // 元素節點的播放速度
  forward: null,          // 快轉按鈕
  back: null,             // 後退按鈕
  next: null,             // 下一頁按鈕
  pageExpr: null,         // 每個符合的元素會成為一個分頁
  act: null,              // 在特定元素上執行指定動作，格式為 [[ expr, callback, option ]]， option 可為 pause 或 queue
  onPageStart: null,      // callback: 頁面開始播放（逐字顯示）
  onPageDump: null,       // callback: 頁面開始播放（一次顯示整頁）
  onForward: null,        // callback: 文字快轉
  dump: 'back',           // 逐字播放或一次顯示整頁，值可以是 back, none, used 或 all
  removeUnused: true,     // 移除不符合 pageExpr 的元素
  trimText: true,         // 移除文字節點前後的空白
  keepInvisible: true     // 不顯示原本就隱藏的元素
};


})(jQuery);
