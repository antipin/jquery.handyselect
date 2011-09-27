(function ($) {

  $(document).ready(function(){
    
    $('#handyselect-1').handyselect({
      selectedOptionsToDisplay: 'all',
      onChange: function(value){
        console.log(value)
      }
    });
    
    $('#handyselect-2').handyselect({
      selectedOptionsToDisplay: 2,
      selectorMode: 'count',
      onChange: function(value){
        console.log(value)
      }
    });
    
    $('#handyselect-3').handyselect({
      selectedOptionsToDisplay: 3,
      onChange: function(value){
        console.log(value)
      }
    });
    
    $('#handyselect-inline').handyselect({
      onChange: function(value){
        console.log(value)
      }
    })
    
  });

}(jQuery));