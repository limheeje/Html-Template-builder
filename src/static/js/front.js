if (window.console == undefined) {
  console = {log: function () {}}
}

$(document).ready(function () {
  // ie9 이하 placeholder 적용
  $('input').placeholder({customClass: 'input-placeholder'})

  // box-ipt 포커스 체크
  var $boxIpt = $('.box-ipt')
  if ($boxIpt.length > 0) {
    $boxIpt.on('focusin', function () {
      var $this = $(this)
      $this.addClass('focus')
    })
    $boxIpt.on('focusout', function () {
      var $this = $(this)
      $this.removeClass('focus')
    })
  }

  if ($('terms-select-box')) {
    $('.terms-tab button').on('click', function () {
      var tabName = $(this).data('tab-name')
      $('.terms-tab button').removeClass('active')
      $(this).addClass('active')
      $('.terms-tab-list ul').hide()
      $('.terms-tab-list ul[data-tab-list=' + tabName + ']').css('display', 'flex')
    })
  }

  // 커스텀 CSS 선택 :: 개발 배포 x
  // $(document).dblclick(function(){
  // 	var customArr = ['','cj'] // 고객사 리스트
  // 	var selectList = document.createElement("select");

  // 	for (var i = 0; i < customArr.length; i++) {
  // 		var option = document.createElement("option");
  // 		if(customArr[i]===''){
  // 			option.value = "";
  // 			option.text = 'KCP';
  // 		}
  // 		if(i > 0){
  // 			option.value = "_"+customArr[i];
  // 			option.text = customArr[i];
  // 		}
  // 		selectList.appendChild(option);
  // 	}

  // 	selectList.classList.add('customStyleList')
  // 	$('#wrap').append(selectList)
  // 	$('head').append(`<link rel="stylesheet" class="customCss" href="static/css/custom.css">`)

  // 	selectList.addEventListener("change", function() {
  // 		var selectedValue = selectList.value;
  // 		$('.customCss').attr('href' , `static/css/custom${selectedValue}.css`)
  // 		setTimeout(function(){
  // 			selectList.remove()
  // 		},3000)
  // 	});
  // });

  $(document).on('keydown', function (e) {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault() // 기본 Enter 키 동작 방지 (줄바꿈)
      // 여기에 실행할 코드를 작성
      var customArr = ['', 'cj'] // 고객사 리스트
      var selectList = document.createElement('select')

      for (var i = 0; i < customArr.length; i++) {
        var option = document.createElement('option')
        if (customArr[i] === '') {
          option.value = ''
          option.text = 'KCP'
        }
        if (i > 0) {
          option.value = '_' + customArr[i]
          option.text = customArr[i]
        }
        selectList.appendChild(option)
      }

      selectList.classList.add('customStyleList')
      $('#wrap').append(selectList)
      $('head').append(`<link rel="stylesheet" class="customCss" href="static/css/custom.css">`)

      selectList.addEventListener('change', function () {
        var selectedValue = selectList.value
        $('.customCss').attr('href', `static/css/custom${selectedValue}.css`)
        selectList.remove()
      })
    }
  })
})
