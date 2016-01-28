(function()
{
App.FileUploaderComponent = Ember.Component.extend({

    maxfile: 5,
    allowDragDrap: true,
    multiple: true,
    files: null,

    sizeLimit: 0,
    minSizeLimit: 0,
    allowedExtensions: '',

    actionURL: '/attachments/upload',
    fileInputSelector: '.uploader-drop-btn input',
    dropAreaSelector: '.uploader-box-small',

    addSuccessFile: function(pack)
    {
        if(!this.get('files'))
        {
            this.set('files', []);
        }

        this.get('files').addObject({
            id   : Ember.get(pack, 'id'),
            name : Ember.get(pack, 'name'),
            token: Ember.get(pack, 'token')
        });
    },

    removeFile: function(pack)
    {
        var file = this.get('files').find(function(item)
        {
            return Ember.get(item, 'id') == Ember.get(pack, 'id');
        });

        this.get('queue').removeObject(pack);
        this.get('files').removeObject(file);
    },

    pushQueue: function(pack)
    {
        this.queue.addObject(pack);
    },

    _init: function()
    {
        var self = this;
        var queue = this.queue = [];
        var files;

        if(!this.get('files'))
        {
            this.set('files', []);
        }

        files = this.get('files');

        files.forEach(function(item)
        {
            self.pushQueue(item);
        });
    }.on('init'),

    filesObserver: function()
    {
        var self = this;
        var files = this.get('files');
        var queue = this.get('queue');

        if(files && files.length)
        {
            files.forEach(function(item)
            {
                if(!queue.findBy('id', Ember.get(item, 'id')))
                {
                    self.pushQueue(item);
                }
            });
        }

        // 清空队列
        // bug files.remove 触发 queue.remove
        if(!files || !files.length)
        {
            queue.clear();
        }
    }.observes('files.[]'),

    setupUploader: function()
    {
        if(!isSupported())
        {
            console.error('XMLHttpRequest Doesn\'t seem to support file upload.');
            
            return;
        }

        this.bindEvents();
    },

    bindEvents: function()
    {
        var self = this;

        this.$el(this.get('fileInputSelector')).on('change', function(e)
        {
            self.addFiles(e.target.files);
        });

        if(this.get('allowDragDrap'))
        {
            this.$el(this.get('dropAreaSelector'))
                .on('dragover', function(e)
                {
                    e.preventDefault();
                    e.stopPropagation();

                    $(this).addClass('box-dragenter');
                })
                .on('dragenter', function()
                {
                    $(this).addClass('box-dragenter');
                })
                .on('dragleave', function()
                {
                    var dropArea = self.$el(self.get('dropAreaSelector')).get(0);

                    if(!$.contains(dropArea, this))
                    {
                        $(this).removeClass('box-dragenter');
                    }
                })
                .on('drop', function(e)
                {
                    e.preventDefault();
                    e.stopPropagation();

                    self.addFiles(e.dataTransfer.files);

                    $(this).removeClass('box-dragenter');
                });
        }
    },

    _isAllowedExtension: function(fileName)
    {
        var ext = (-1 !== fileName.indexOf('.')) ? fileName.replace(/.*[.]/, '').toLowerCase() : '';
        var allowed = this.allowedExtensions ? this.allowedExtensions.split(/[, ]+/) : [];

        if(!allowed.length)
        {
            return true;
        }
        
        for (var i = 0; i <  allowed.length; i++)
        {
            if (allowed[i].toLowerCase() == ext)
            {
                return true;
            }
        }
        
        return false;
    },

    _validateFile: function(pack)
    {
        var 
            file = pack.file,
            name, size;

        // fix missing properties in Safari
        name = file.fileName != null ? file.fileName : file.name;
        size = file.fileSize != null ? file.fileSize : file.size;
                    
        if(!this._isAllowedExtension(name))
        {            
            this._error('typeError', pack);
            return false;
            
        } 
        else if (size === 0)
        {            
            this._error('emptyError', pack);
            return false;
                                                     
        } 
        else if (size && this.sizeLimit && size > this.sizeLimit)
        {            
            this._error('sizeError', pack);
            return false;
                        
        } 
        else if (size && size < this.minSizeLimit)
        {
            this._error('minSizeError', pack);
            return false;            
        }
        
        return true;                
    },

    _error: function(errorType, pack)
    {
        var errorMap = {
            'typeError': '不支持的类型',
            'emptyError': '内容为空',
            'sizeError': '大小超过限制',
            'minSizeError': '文件太小'
        };

        Ember.set(pack, 'error', errorMap[errorType]);
    },

    uploadFile: function(file)
    {
        var pack = this._packFile(file);

        this.get('queue').addObject(pack);

        if(this._validateFile(pack))
        {
            upload(this.get('actionURL'), pack);
        }
    },

    addFiles: function(files)
    {
        if(this.get('files.length') + files.length > this.get('maxfile'))
        {
            KF5.alert('最多只能上传' + this.get('maxfile') + '个附件');
            return;
        }

        for(var i = 0; i < files.length; i++)
        {
            this.uploadFile(files[i]);
        }
    },

    _packFile: function(file)
    {
        var 
            self = this,
            name = file.fileName != null ? file.fileName : file.name,
            size = file.fileSize != null ? file.fileSize : file.size;

        return {
            'nameHolder': 'qqfile',
            'name': name,
            'size': size,
            'file': file,
            'loaded': 0,
            'total': 0,
            'error': false,
            'id': null,
            'token': null,
            'isImage': /\.(gif|jpg|jpeg|png)$/i.test(name),
            onProgress: function(pack, loaded, total)
            {
                Ember.set(pack, 'loaded', loaded);
                Ember.set(pack, 'total', total);
            },
            onComplete: function(xhr, pack)
            {
                pack.onProgress(pack, pack.size, pack.size);

                var response;

                if(xhr.status == 200)
                {
                    try 
                    {
                        response = eval("(" + xhr.responseText + ")");
                    } 
                    catch(err)
                    {
                        response = {};
                    }

                    if(response && response.success)
                    {
                        Ember.set(pack, 'id', response.id);
                        Ember.set(pack, 'name', response.name);
                        Ember.set(pack, 'token', response.token);

                        self.addSuccessFile(pack);
                    }
                    else
                    {
                        Ember.set(pack, 'error', '上传失败');
                    }
                }
                else
                {
                    Ember.set(pack, 'error', '上传失败');
                }
            }
        };
    },

    didInsertElement: function()
    {
        this._super();

        this.setupUploader();
    },

    actions: {

        preview: function(pack)
        {
            if(Ember.get(pack, 'isImage'))
            {
                attachment_preview(Ember.get(pack, 'id'));
            }
        },

        deleteFile: function(pack)
        {
            var self = this;

            if(pack.token)
            {
                $.post(App.get('config.api.attachmentDelete'),
                    {
                        token: pack.token
                    },
                    function(data)
                    {
                        if(data == 'success')
                        {
                            self.removeFile(pack);
                        }
                        else
                        {
                            KF5.alert('删除失败! ' + data);
                        }
                    }
                );
            }
            else
            {
                this.get('queue').removeObject(pack);
            }
        }
    }
});

function isSupported()
{
    var input = document.createElement('input');

    input.type = 'file';
    return (
        'multiple' in input &&
        typeof window.File != "undefined" &&
        typeof (new XMLHttpRequest()).upload != "undefined" );
}

function upload(url, pack)
{
    var xhr = pack.xhr = new XMLHttpRequest();
    var self = this;

    xhr.upload.onprogress = function(e) 
    {
        if(e.lengthComputable) 
        {
            pack.onProgress(pack, e.loaded, e.total);
        }
    };

    xhr.onreadystatechange = function() 
    {
        if (xhr.readyState == 4 && pack.onComplete) 
        {
            pack.onComplete(xhr, pack);
        }
    };

    // build query string
    var params = {};
    params[pack.nameHolder] = pack.name;

    var queryString = urlParams(params, url);

    xhr.open("POST", queryString, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(pack.name));
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.send(pack.file);
}

function urlParams(obj, temp, prefixDone) 
{
        var uristrings = [],
            prefix = '&',
            add = function(nextObj, i) 
            {
                var nextTemp = temp ? (/\[\]$/.test(temp)) // prevent double-encoding
                    ? temp : temp + '[' + i + ']' : i;
                if ((nextTemp != 'undefined') && (i != 'undefined')) 
                {
                    uristrings.push(
                        (typeof nextObj === 'object') 
                                ? urlParams(nextObj, nextTemp, true) 
                                : (Object.prototype.toString.call(nextObj) === '[object Function]') 
                                        ? encodeURIComponent(nextTemp) + '=' + encodeURIComponent(nextObj()) 
                                        : encodeURIComponent(nextTemp) + '=' + encodeURIComponent(nextObj)
                    );
                }
            };

        if (!prefixDone && temp) 
        {
            prefix = (/\?/.test(temp)) ? (/\?$/.test(temp)) ? '' : '&' : '?';
            uristrings.push(temp);
            uristrings.push(urlParams(obj));
        } 
        else if ((Object.prototype.toString.call(obj) === '[object Array]') && (typeof obj != 'undefined')) 
        {
            // we wont use a for-in-loop on an array (performance)
            for (var i = 0, len = obj.length; i < len; ++i) 
            {
                add(obj[i], i);
            }
        } 
        else if ((typeof obj != 'undefined') && (obj !== null) && (typeof obj === "object")) 
        {
            // for anything else but a scalar, we will use for-in-loop
            for (var i in obj) 
            {
                add(obj[i], i);
            }
        } 
        else 
        {
            uristrings.push(encodeURIComponent(temp) + '=' + encodeURIComponent(obj));
        }

        return uristrings.join(prefix)
            .replace(/^&/, '')
            .replace(/%20/g, '+'); 
}

})();