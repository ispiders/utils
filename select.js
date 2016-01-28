(function()
{
    "use strict";

    var _options = {
            prompt: undefined, // default label text
            name: undefined, // input name
            value: undefined, // default value
            tabindex: -1,
            optionLabelPath: 'content.label',
            optionValuePath: 'content.value',
            optionGroupPath: 'group',
            selectors: {
                group: '.option-group',
                groupTitle: '.group-title',
                option: '.option-item',
                optionList: '.select-options',
                optionWrapper: '.options-ul',
                label: '.select-field',
                valueHolder: 'input[type=hidden]'
            },
            templates: {
                layout: '<div class="kf5-select"><a class="select-field"></a><input type="hidden" /><div class="select-options"><div class="options-ul"></div></div></div>',
                option: '<div class="option-li"><a class="option-item"></a></div>',
                group: '<div class="option-group"><span class="group-title"></span></div>'
            }
        };

    /**
     * 模拟下拉框
     * @param {[type]} options 配置
     * @param {[type]} data    选项数据
     */
    function Select(options, data)
    {
        this._init(options, data);
    }

    window.Select = Select;

    Select.prototype = {

        getSelector: function(element)
        {
            return this.options.selectors[element];
        },

        getElements: function(element)
        {
            return this.find(this.getSelector(element));
        },

        getElement: function(element)
        {
            return this.getElements(element).first();
        },

        find: function(selector)
        {
            return this.$element.find(selector);
        },

        getValue: function()
        {
            return $(this.getSelected()).data('value');
        },

        setValue: function(value)
        {
            var self = this;

            if(value !== this.getValue())
            {
                this.getElements('option').each(function()
                {
                    if($(this).data('value') == value)
                    {
                        self.setSelected(this);

                        return false;
                    }
                });
            }

            this.options.value = value;

            return value;
        },

        getLabel: function()
        {
            return $(this.getSelected()).text();
        },

        /**
         * 被选中的 option 元素
         */
        getSelected: function()
        {
            var selected = this.find('.selected');

            if(!selected.length)
            {
                selected = this.getElement('option');
            }

            return selected.get(0);
        },

        setSelected: function(option)
        {
            var valueHolder = this.getElement('valueHolder'),
                selected = this.getSelected();

            if(selected !== option)
            {
                this.getElements('option').removeClass('selected');
                $(option).addClass('selected');

                this.update();
            }

            return option;
        },

        update: function()
        {
            var 
                $valueHolder = this.getElement('valueHolder'),
                oldValue = $valueHolder.val();

            if(oldValue !== this.getValue())
            {
                $valueHolder.val(this.getValue());
                $valueHolder.trigger('change');
            }

            this.getElement('label').text($(this.getSelected()).text());

            return this;
        },

        getOpt: function(key)
        {
            return this.options[key];
        },

        _clearList: function()
        {
            this.getElement('optionWrapper').html('');

            return this;
        },

        renderList: function(data, value)
        {
            this._clearList();

            if(this.getOpt('prompt'))
            {
                this.addOption(undefined, this.getOpt('prompt'));
            }

            if(data)
            {
                this.data = data;
                this._prepare();
            }

            this.setValue(value);

            this.update();

            return this;
        },

        _init: function(options, data)
        {
            this.options = $.extend(true, {}, _options);
            this.options = $.extend(true, this.options, options);

            this.$element = $(this.options.element);

            if(!this.$element.length)
            {
                this.$element = $(this.getTemplate('layout'));
            }

            this.$element.get(0).select = this;

            this.options.value = this.getElement('valueHolder').val() || this.getOpt('value');

            this.renderList(data, this.options.value);

            this.getElement('optionList').hide();

            this._bindEvents();
        },

        getTemplate: function(template)
        {
            return this.options.templates[template];
        },

        appendTo: function(selector)
        {
            this.$element.appendTo(selector);

            return this;
        },

        _prepare: function()
        {
            var data = this.data, 
                type = Object.prototype.toString.call(data).toLowerCase();

            if(this.getOpt('name'))
            {
                this.getElement('valueHolder').attr('name', this.getOpt('name'));
            }

            if(type == '[object object]')
            {
                for(var key in data)
                {
                    if(data.hasOwnProperty(key))
                    {
                        this.addOption(key, data[key]);
                    }
                }
            }
            else if(type == '[object array]')
            {
                for(var i = 0; i < data.length; i++)
                {
                    (function(self, content, index){
                        if(typeof content === 'object')
                        {
                            self.addOption(
                                eval(self.getOpt('optionValuePath')), 
                                eval(self.getOpt('optionLabelPath')), 
                                eval('content.' + self.getOpt('optionGroupPath'))
                            );
                        }
                        else
                        {
                            self.addOption(index, content);
                        }
                    })(this, data[i], i);
                }
            }

            return this;
        },

        addGroup: function(groupName)
        {
            var $group = $(this.getTemplate('group')).attr('data-group', groupName);
                $group.find(this.getSelector('groupTitle')).text(groupName);

            this.getElement('optionWrapper').append($group);

            return $group;
        },

        getGroup: function(groupName)
        {
            var $group = this.getElements('group')
                    .filter('[data-group="' + groupName + '"]');

            if(!$group.length)
            {
                $group = this.addGroup(groupName);
            }

            return $group;
        },

        addOption: function(value, label, groupName)
        {
            var option = $(this.getTemplate('option'));
                option.find(this.getSelector('option'))
                    .data('value', value)
                    .text(label);

            if(groupName)
            {
                this.getGroup(groupName).append(option);
            }
            else
            {
                this.getElement('optionWrapper').append(option);
            }

            return this;
        },

        _bindEvents: function()
        {
            var self = this;
            this.$element.on('click', this.getSelector('option'), function()
            {
                self.setSelected(this);
            });

            this.$element.on('click', 'input', function(e)
            {
                e.stopPropagation();

                return false;
            });

            var label = this.getSelector('label');
            this.find(label)
                    .on('click', function(e)
            {
                if(!self.$element.hasClass('disabled'))
                {
                    self.toggleOptionsList();
                }
            });

            $(document).on('click', function(e)
            {
                if(e.target === self.getElement('label').get(0) 
                        && !self.getElement('label').find(e.target).length)
                {
                    return;
                }
                else
                {
                    self.hideOptionsList();
                }
            });

            this.getElement('valueHolder').on('change', function()
            {
                self.setValue(this.value);
            });

            this.$element.attr('tabindex', this.getOpt('tabindex'));
            this.$element
            .on('focus', function()
            {
                self.getElement('label').addClass('focus');
            })
            .on('blur', function()
            {
                self.getElement('label').removeClass('focus');
            });
        },

        toggleOptionsList: function()
        {
            var list = this.getElement('optionList'),
                selectRect = this.$element.get(0).getBoundingClientRect();

            // 判断下方如果没有足够的空间显示列表，则显示到上方
            if(($(window).height() - selectRect.bottom) < list.height()
                    && selectRect.top >= list.height())
            {
                list.addClass('from-bottom');
            }
            else
            {
                list.removeClass('from-bottom');
            }

            // if(this.$element.offset().top - this.$element.offsetParent().offset().top > list.height())
            // {
            //     list.addClass('from-bottom');
            // }
            // else
            // {
            //     list.removeClass('from-bottom');
            // }

            list.toggle();
            if(list.is(':visible'))
            {
                list.triggerHandler('optionListShow');
            }

            return this;
        },

        hideOptionsList: function()
        {
            var $optionList = this.getElement('optionList');
            
            if($optionList.is(':visible'))
            {
                $optionList.hide();
                $optionList.triggerHandler('optionListHide');
            }

            return this;
        },

        disable: function()
        {
            this.$element.addClass('disabled');
            this.hideOptionsList();

            return this;
        },

        enable: function()
        {
            this.$element.removeClass('disabled');

            return this;
        }
    };
})();