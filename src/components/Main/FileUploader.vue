<template>
    <div class="fe-uploader-wrapper" @dragleave="dragLeave">
        <div 
            class="fe-dropzone" 
            @click="addFiles()"
            @drop="dropFiles"
            @dragover="dragOver"
            >
            <div class="large-12 medium-12 small-12 cell">
                <input 
                    type="file" 
                    id="files" 
                    ref="files" 
                    multiple 
                    @change="handleFilesUpload"
                />
            </div>
            <div class="large-12 medium-12 small-12 cell">
                <div class=" file-listing col-xs-6 col-sm-6 col-md-2 fe-item-margin"
                    v-for="(file, key) in files" 
                    :key="key"
                >
                    <div class="fe-item">
                        <div class="fe-item-wrapper"><img class="img-responsive" src="images/file_type_unknown.png">
                        <span class="fe-title-text">{{file.name}}</span>
                        <br/>
                            <span 
                                class="remove-file" 
                                @click="removeFile($event, key)"
                            > Remove
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <br>
            <label 
                v-if="!submitToSend"
            >
                <strong>Click or drag file here</strong>
            </label>
            <br>
            <div class="large-12 medium-12 small-12 cell">
                <!--<button 
                    class="btn fe-submit-button" 
                    v-if="submitToSend" 
                    @click.stop="submitFiles"
                >Submit
                </button>-->
            </div>
        </div>
    </div>    
</template>

<script>
    import { HTTP_PREFIX } from '../../providers/common'

    export default {
        template: '',
        props: ['url', 'dir'],
        data() {
            return {
                files: [],
                submitToSend: false
            }
        },
        methods: {
            addFiles() {
                this.$refs.files.click();
            },
            submitFiles(e) {
                if (this.files.length === 0) return;

                const formData = new FormData();
                formData.append('id', this.dir.id);
                const ctx = this;
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    formData.append('files', file, file.name);
                }
                this.$http.post(HTTP_PREFIX + 'api/upload/' + this.url,
                    formData, 
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                        'Content-Type': 'multipart/form-data'
                    }
                }
                ).then(function(){
                    ctx.files.splice(0, ctx.files.length);
                    ctx.$parent.$emit('listUpdate', '', ctx.dir.id);
                    ctx.submitToSend = false;
                    ctx.$emit('close');
                })
                .catch(function(err){
                    console.log(err);
                });
            },
            handleFilesUpload() {
                const uploadedFiles = this.$refs.files.files;
                for (let i = 0; i < uploadedFiles.length; i++){
                    this.files.push(uploadedFiles[i]);
                }
                if (this.files.length) {
                    this.submitToSend = true;
                }
            },
            removeFile(e, key) {
                e.stopImmediatePropagation();
                this.files.splice(key, 1);

                if (this.files.length === 0) {
                    this.submitToSend = false;
                    this.$emit('close');
                } else {
                    this.submitToSend = true;
                }
            },
            dragOver(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            },
            dragLeave(e) {
                if (this.files.length === 0) { 
                    this.$emit('close');
                }
            },
            dropFiles(e) {
                e.stopPropagation();
                e.preventDefault();
                const uploadedFiles = e.dataTransfer.files;
        
                for (let i = 0; i < uploadedFiles.length; i++){
                    this.files.push(uploadedFiles[i]);
                }

                if (this.files.length === 0) {
                    this.submitToSend = false;
                } else {
                    this.submitToSend = true;
                }
            }
        },
        created() {
            this.$parent.$on('submitSend', this.submitFiles);
        },
        beforeDestroy() {
            this.$parent.$off('submitSend', this.submitFiles);
        }
    }
</script>

<style>
    .fe-uploader-wrapper {
        box-sizing: border-box;
        display: inline-block;
        width: 100%;
        height: 100%;
    }
    .fe-dropzone {
        overflow:auto;
        height: 97%;
        min-height: 98%;
        border: 3px grey dashed;
        border-radius: 10px;
        margin: 5px 5px 5px 5px;
    }

    .fe-title-text {
        width: 100%;
        position: relative;
        background-color: transparent;
        display: inline-block;
        border: none;
        text-align: center;
        word-wrap: break-word;
        text-overflow: ellipsis;
    }

    input[type="file"] {
        position: absolute;
        top: -500px;
    }
    div.file-listing {
        width: 200px;
    }
    span.remove-file {
        color: red;
        cursor: pointer;
        /* float: right; */
    }
</style>