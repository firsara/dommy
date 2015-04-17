/*
 * jQuery.fn.ajaxForm
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * lets jquery fetch all form items
 * runs validation through items and eventually adds an error class
 * runs data through ajax call by fetching the form-defined action and method
 *
 * example:
 * <form action="mail.php" method="post">
 *   <input type="text" name="name" class="required">
 *   <input type="email" name="email" required>
 * </form>
 *
 * $('form').ajaxForm(success, error);
 */
(function(window, document, $, undefined){

    $.fn.ajaxForm = function(callback, callbackError){
      $(this).each(function(){
        // cache form
        var form = $(this);

        // email validation
        var validateEmail = function(email){
          var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(email);
        };

        var validateForm = function(e){
          var form = $(this);

          // remove errors in the first place (i.e. assume the data is fine)
          form.find('.error').removeClass('error');

          // find all required fields
          form.find('.required, [required]').each(function(){
            // assume the field is valid
            var valid = true;
            var val = $(this).val();

            // get field value
            var type = $(this).attr('type');

            // override type if it's a textarea or a select field
            if ($(this).is('textarea')) type = 'textarea';
            if ($(this).is('select')) type = 'select';

            // NOTE: the defined placeholder attribute is not a valid value for any field
            // TODO: maybe allow an option to bypass this check?
            if ($(this).val() === $(this).attr('placeholder')) valid = false;

            // empty values also don't validate
            if (val === '') valid = false;

            // validate field depending on its type
            switch(type){
              case 'email':
                valid = validateEmail(val);
              break;
              case 'textarea':
                if (val.length < 10) valid = false;
              break;
              case 'select':
                if (val.length < 1) valid = false;
              break;
              case 'checkbox':
                if (! $(this).is(':checked')) valid = false;
              break;
              case 'radio':
                if (form.find('input[name="'+$(this).attr('name')+'"]:checked').size() == 0) valid = false;
              break;
              case 'text':
              default:
                if (val.length < 3) valid = false;
              break;
            };

            // for invalid fields add an error class to the field itself and the associated label
            if (! valid) {
              form.find('label[for="' + $(this).attr('id') + '"]').addClass('error');
              $(this).addClass('error');
            }

          });

          // if there are any errors -> don't allow to submit the form
          if (form.find('.error').size() > 0){
            e.preventDefault();
            return false;
          } else {
            // prevent default form submission
            e.preventDefault();

            // disable submit field so no multiple submissions should happen
            // TODO: integrate a variable that checks when the form is released again
            form.find('input[type="submit"]').attr('disabled', 'disabled');

            // get form attributes and pass serialized form data
            var opts = {
              type: form.attr('method'),
              url: form.attr('action'),
              data: form.serialize()
            };

            // call appropriate callbacks
            opts.success = function(result){
              form.find('input[type="submit"]').removeAttr('disabled');
              if (callback) callback.call(this, result);
            };

            opts.error = function(result){
              form.find('input[type="submit"]').removeAttr('disabled');
              if (callbackError) callbackError.call(this, result);
            };

            $.ajax(opts);

            return false;
          }
        };

        // explicitly set form to novalidate through HTML5 as it will validate itself
        form.attr('novalidate', 'novalidate');

        // on submit -> validate form
        form.submit(validateForm);

        return this;
      });

      return this;
    };

})(window, window.document, jQuery);
