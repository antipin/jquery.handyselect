$(document).ready(function(){
  
  var myConsole = $('#console');
  
  $('#handySelect-1').handySelect({
    selectedOptionsToDisplay: 'all',
    onChange: function(value){
      console.log(value)
    }
  });
  
  $('#handySelect-2').handySelect({
    selectedOptionsToDisplay: 2,
    selectorMode: 'count',
    onChange: function(value){
      console.log(value)
    }
  });
  
  $('#handySelect-3').handySelect({
    selectedOptionsToDisplay: 3,
    onChange: function(value){
      console.log(value)
    }
  });
  
  $('#handySelect-inline').handySelect({
    onChange: function(value){
      console.log(value)
    }
  })
  
});