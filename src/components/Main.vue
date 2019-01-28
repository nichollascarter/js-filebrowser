<template>
    <div class="fe-wrapper" @click="rootClick">
        <properties v-if="showProperties" @close="showProperties = false" :url="currURL" :target="currTarget"></properties>
        <modal v-if="showWarning" @close="showWarning = false"> 
            <div slot="body">You don't have access rights</div>
            <h3 style="color: red" slot="header">Warning</h3>
        </modal>
        <div class="pb-filemng-template" > <!--container -->
            <nav class="navbar pb-filemng-navbar" @click.stop>
                <div class="container-fluid">
                    <!-- Navigation -->
                    <div class="navbar-header">
                        <button type="button" class="pull-left navbar-toggle collapsed treeview-toggle-btn" data-toggle="collapse" data-target="#treeview-toggle" aria-expanded="false">
                            <span class="sr-only">Toggle navigation</span>
                            <span class="icon-bar"></span>
                            <span class="icon-bar"></span>
                            <span class="icon-bar"></span>
                        </button>

                        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#options" aria-expanded="false">
                            <span class="sr-only">Toggle navigation</span>
                            <span class="fa fa-gears"></span>
                        </button>

                        <!-- Search button -->
                        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#pb-filemng-navigation" aria-expanded="false">
                            <span class="sr-only">Toggle navigation</span>
                            <span class="fa fa-share"></span>
                        </button>
                    </div>

                    <ul id="options" class="collapse navbar-collapse nav navbar-nav navbar-right" aria-expanded="false">
                        <li><a @click='createFolder' v-if="$can('read', 'Allow')"><span class="fa fa-folder fa-lg"></span></a></li>
                        <li><a @click='pasteFiles' v-if="$can('read', 'Allow') && clipboard.length"><span class="fa fa-clipboard fa-lg"></span></a></li>
                        <li><a @click='copyFiles' v-if="$can('read', 'Allow') && isAnySelected"><span class="fa fa-clone fa-lg"></span></a></li>
                        <li><a @click='removeFiles' v-if="$can('delete', 'Allow') && isAnySelected"><span class="fa fa-trash fa-lg"></span></a></li>
                        <li><a @click="selectAll" v-if="elements.length"><span class="fa fa-lg fa-server"></span></a></li>
                        <li><a @click='sendFiles' v-if="$can('upload', 'Allow')"><span class="fa fa-upload fa-lg"></span></a></li>
                        <li><a @click='downloadFiles' v-if="$can('download', 'Allow')"><span class="fa fa-download fa-lg"></span></a></li>
                        <li><a @click='logout'><span class="fa fa-lg fa-times"></span></a></li>
                    </ul>
                    <div class="collapse navbar-collapse" id="pb-filemng-navigation">
                        <ul class="nav navbar-nav">
                            <li><a @click='goToPreviousURL'><span class="fa fa-chevron-left fa-lg"></span></a></li>
                            <li><a @click='goToNextURL'><span class="fa fa-chevron-right fa-lg"></span></a></li>
                            <li class="pb-filemng-active"><a><span class="fa fa-file fa-lg"></span></a></li>
                        </ul>
                        <form class="form-inline my-2 my-lg-0">
                            <input class="form-control mr-sm-2 fe-search" type="search" v-model="search" placeholder="Search..." aria-label="Search">
                        </form>
                    </div>
                </div>
            </nav>
            <div class="fe-panel">
                <div class="panel-body pb-filemng-panel-body" :style="style">
                    <div class="row" v-show="isDragging">
                        <file-uploader @close="isDragging = false" :url="currURL" :dir="currFolder"></file-uploader>
                    </div>
                    <div class="row" v-show="!isDragging" @dragover="dragOver">
                        <div class="col-sm-3 pb-filemng-template-treeview">
                            <div id="treeview-toggle">
                                <ul id="treeview" class="fe-tree">
                                    <tree v-for="el in treeView" :model="el" :key="el.name"></tree>
                                </ul>
                            </div>
                        </div>
                        <div class="col-sm-9 pb-filemng-template-body" @contextmenu.prevent="openCtxMenu">
                            <component v-for="el in filteredList" :is="el.type" :key="el.name" :model="el"></component>                           
                        </div>
                    </div>
                </div>
            </div>
            <div>  
                <div class='fe-context-menu' ref="ctxMenu" v-if="showMenu">
                    <ul class='fe-context-items'>
                        <li v-for="item in ctxMenuItems" :key="item[1]"
                            @click="selectCtxItem($event, item[1])">{{item[0]}}
                        </li>
                    </ul>
                    <!--<hr/>--> 
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import Vue from 'vue'
    import Modal from './Main/Modal'
    import TreeView from './Main/TreeView'
    import FileUploader from './Main/FileUploader'
    import Properties from './Admin/Properties'
    import UndoStack from '../providers/UndoStack'
    import { HTTP_PREFIX, defineProperty } from '../providers/common'
    import EventHub from '../providers/EventHub'
    import saveAs from 'file-saver'

    const History = new UndoStack();

    const FILE_TYPES = [
        'avi',
        'css',
        'dll',
        'doc',
        'eps',
        'html',
        'jpg',
        'mov',
        'mp3',
        'pdf',
        'png',
        'ppt',
        'psd',
        'txt',
        'wav',
        'xls',
        'zip'
    ];

    const itemMixin = {
        props:['model'],
        data() {
            return {
                isEditing: false,
                isHovered: false,

                customStyle: {
                    background: 'transparent'
                },
                hoverStyle: {
                    background: 'rgba(52, 73, 94, 0.3)'
                },
                selectedStyle: {
                    color: 'white',
                    background: 'rgba(52, 73, 94, 0.6)'
                }
            }
        },
        computed: {
            classState() {
                if (this.model.selected === true) {
                    return this.selectedStyle;
                } else {
                    if (this.isHovered === true) {
                        return this.hoverStyle;
                    } else {
                        return this.customStyle;
                    }
                }
            },
            readonly() {
                return !this.$can('read', 'Allow') ? true : false
            }
        },
        methods: {
            renameFile($event) {
                this.isEditing = true; 
                const ctx = this;
                this.$nextTick(function () {
                    ctx.$refs.editField.focus();
                });
            },
            doRenameFile(e) {
                this.isEditing = false;
                this.selectedStyle.color = 'white';
                if (this.model.name !== this.$refs.editField.value) {
                    this.$parent.$emit(
                        'fileRename', 
                        this.model.parentId,
                        this.model.name, 
                        this.$refs.editField.value, 
                        this.model.type === 'folder'
                    );
                }  
            },
            setStyle() {
                this.selectedStyle.color = 'black';
            },
            openMenu(e) {
                e.stopImmediatePropagation();
                this.$parent.$emit(
                    'itemClicked', 
                    e, 
                    this.model
                );
                this.$parent.$emit(
                    'openMenu', 
                    e, 
                    this.model
                );
            },
            clickItem(e) {
                e.stopImmediatePropagation();
                this.$parent.$emit(
                    'itemClicked', 
                    e, 
                    this.model
                );
            },
            hoverItem() {
                this.isHovered = true;
            },
            leaveItem() {
                this.isHovered = false;    
            }
        }
    };

    const simpleFile = {
        template:   '<div class="col-xs-6 col-sm-6 col-md-2 fe-item-margin">\
                        <div class="fe-item"\
                            :style="classState"\
                            @click="clickItem($event, model)"\
                            @mouseover="hoverItem"\
                            @mouseleave="leaveItem" \
                            @contextmenu.prevent="openMenu">\
                            <div class="fe-item-wrapper">\
                                <img class="img-responsive" :src="model.image_url"><br/>\
                                <input type="text"\
                                    class="fe-editable-text"\
                                    ref="editField"\
                                    @focus="setStyle"\
                                    @blur="doRenameFile"\
                                    :readonly="readonly"\
                                    :disabled="readonly"\
                                    :value="model.name">\
                            </div>\
                        </div>\
                    </div>',
        mixins: [itemMixin],
        data() {
            return {}
        },
        methods: {
        }
    };

    const simpleFolder = {
        template:   '<div class="col-xs-6 col-sm-6 col-md-2 fe-item-margin">\
                        <div class="fe-item"\
                            :style="classState"\
                            @click="clickItem($event, model)"\
                            @mouseover="hoverItem"\
                            @mouseleave="leaveItem"\
                            @dblclick="goToPath(model.url, model.id)"\
                            @contextmenu.prevent="openMenu">\
                            <div class="fe-item-wrapper">\
                                <img class="img-responsive" :src="model.image_url"><br/>\
                                <input type="text"\
                                class="fe-editable-text"\
                                ref="editField"\
                                @focus="setStyle"\
                                @blur="doRenameFile"\
                                :readonly="readonly"\
                                :disabled="readonly"\
                                :value="model.name">\
                            </div>\
                        </div>\
                    </div>',
        mixins: [itemMixin],
        data() {
            return {}
        },
        
        methods: {
            goToPath(path, id) { 
                this.$parent.$emit('listUpdate', path, id);
            } 
        }    
    };

    export default {
        data() {
            return {
                search: '',
                elements: [],
                treeView: [{
                    id: 'null',
                    name : 'Root',
                    url: '/',
                    selected: true,
                    open: true,
                    children: []
                }],
                currURL: '',
                currTarget: null, //selected item in list
                currFolder: null, //selected directory in TreeView
                isDragging: false,
                isAnySelected: false,
                showWarning: false,
                style: {
                    opacity: 1
                },
                clipboard: [],
                showMenu: false,
                showProperties: false,
                ctxMenuItems: [],

                ctxMenuFile: [
                    ['Copy', 1],
                    ['Delete', 3],
                    ['Properties', 7]
                ],
                ctxMenuFolder: [
                    ['Paste', 2],
                    ['Delete', 3],
                    ['Properties', 7]
                ],
                ctxMenuCommon: [
                    ['Paste', 2],
                    ['New Folder', 6]
                ]
            }
        },
        computed: {
            filteredList() {
                return this.elements.filter(post => {
                    return post.name.toLowerCase().includes(this.search.toLowerCase())
                })
            }
        },
        methods: {
            httpPost(url, data, access, err) {
                const ctx  = this;
                ctx.$http.post(url,
                {   
                    data: data
                }, 
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    access(
                        response.data
                    );
                })
                .catch((e) => {
                    ctx.httpErrorProcess(e, err);
                });
            },
            httpGet(url, access, err) {
                const ctx  = this;
                ctx.$http.get(url,
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    access(
                        response.data
                    );
                })
                .catch((e) => {
                    ctx.httpErrorProcess(e, err);
                });
            },
            httpGetBlob(url, data, access) {
                const ctx  = this;
                ctx.$http.post(url,
                {   
                    data: data
                },
                {
                    responseType: 'blob', //important
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    access(
                        response.data, 
                        response.headers['content-type']
                    );
                })
                .catch((e) => {
                    ctx.httpErrorProcess(e);
                });
            },
            httpErrorProcess(err, callback) {
                
                if (err.response.status === 401) {
                    this.logout();
                    return;
                }
                if (err.response.status === 403) {
                    this.accessError();
                }

                if (callback) {
                    callback();
                }

                return err;
            },
            dragOver(e) {
                e.preventDefault();
                if (this.$can('upload', 'Allow')) {
                    this.isDragging = true;
                }
            },
            checkIsAnySelected() {
                this.isAnySelected = false;
                for (let i = 0, len = this.elements.length; i < len; i++) {
                    const item = this.elements[i];
                    if (item.selected === true) {
                       this.isAnySelected = true;
                       break;
                    }
                } 
            },
            logout() {
                localStorage.setItem('jwt', 'null');
                this.$router.push('login');
            },
            accessError() {
               this.showWarning = true;
            },
            goToPreviousURL() {
                EventHub.$emit('backTo', History.undo());
            },
            goToNextURL() {
                EventHub.$emit('backTo', History.redo());
            },   
            updateList(path, id, callback) {
                this.httpPost(
                    HTTP_PREFIX + 'api/content/' + path,
                    {
                        id: id
                    },
                    data => {
                        this.elements = getFileList(data);
                        callback();
                    },
                    () => {
                        this.elements = [];
                    }
                )
            },
            updateTree() {
                this.httpGet(
                    HTTP_PREFIX + 'api/struct/',
                    data => {
                        this.treeView[0].children = 
                            getTreeData(data, this.treeView[0]); 
                        this.selectInTree(this.currURL, this.treeView[0]);
                    },
                    () => {
                        this.elements = [];
                    }
                )
            },
            // выбираем элемент дерева если переход в директорию
            // выполнен не из дерева
            selectInTree(path, tree) {
                this.currFolder.open = true;
                if (path === '') {
                    tree.selected = true;
                    this.currFolder = tree;
                } else {
                    const names = path.split('*');
                    let id = 1;
                    const nextPath = (tree) => {
                        for (let i = 0; i < tree.children.length; i++) {
                            const child = tree.children[i];
                            if(child.name === names[id]) {
                                if (id < names.length - 1) {
                                    id++;
                                    nextPath(child);
                                } else {
                                    child.selected = true;
                                    this.currFolder = child;
                                }
                                break;
                            }
                        }
                    };
                    nextPath(tree);
                }  
            },
            createFolder(path) {
                this.httpPost(
                    `${HTTP_PREFIX}api/create-folder/${this.currURL}*New Folder`,
                    { 
                        id: this.currFolder.id,
                        name: 'New Folder' 
                    },
                    data => {
                        this.updateList(
                            this.currURL, 
                            this.currFolder.id,
                            () => {}
                        );
                        this.updateTree();
                    }
                )
            },
            sendFiles() {
                this.$emit('submitSend');
                //this.isDragging = !this.isDragging;
            },
            rootClick(e) {
                this.showMenu = false;
                for (let i = 0, len = this.elements.length; (i < len) && !e.ctrlKey; i++) {
                    this.elements[i].selected = false;
                }
            },
            selectAll(e) {
                e.stopImmediatePropagation();
                for (let i = 0, len = this.elements.length; i < len; i++) {
                    this.elements[i].selected = true;
                }
                this.isAnySelected = true;
            },
            downloadFiles() {
                for (let i = 0, len = this.elements.length; i < len; i++) {
                    const item = this.elements[i];
                    if (item.selected === true && item.type === 'file') {
                        this.httpGetBlob(
                            HTTP_PREFIX + 'api/download/' + this.currURL + '*' + item.name,
                            {id: this.currFolder.id},
                            (data, type) => {
                                const blob = new Blob([data], {type: type});
                                saveAs(blob, item.name);
                            }
                        )
                    }
                }
            },
            copyFiles() {
                const bufferData = {
                    url: this.currURL,
                    files: []
                };
                this.clipboard = [bufferData];
                for (let i = 0, len = this.elements.length; i < len; i++) {
                    const item = this.elements[i];
                    if (item.selected === true && item.type === 'file') {
                        bufferData.files.push({
                            id: item.id,
                            name: item.name
                        });
                    }
                }
            },
            pasteFiles() {
                if (this.clipboard.length) {
                    this.httpPost(
                        HTTP_PREFIX + 'api/paste/' + this.currURL,
                        {
                            id: this.currFolder.id,
                            clipboard: this.clipboard[0]
                        },
                        (data, type) => { 
                            this.updateList(
                                this.currURL,
                                this.currFolder.id,
                                () => {}
                            )
                        }
                    )
                }
            },
            removeFiles() {
                const itemsList = [];
                for (let i = 0, len = this.elements.length; i < len; i++) {
                    const item = this.elements[i];
                    if (item.selected === true) {
                        itemsList.push({
                            type: item.type, 
                            name: item.name, 
                            id: item.id, 
                            parentId: item.parentId
                        });
                    }
                }
                this.httpPost(
                    HTTP_PREFIX + 'api/delete/' + this.currURL,
                    {
                        id: this.currFolder.id,
                        items: itemsList
                    },
                    data => {
                        this.updateList(
                            this.currURL,
                            this.currFolder.id,
                            () => {
                                this.checkIsAnySelected();
                            }
                        );
                        this.updateTree(
                            this.currURL, 
                            () => {}
                        );
                    }
                )
            },
            openCtxMenu(e, model) {
                if (model) {
                    this.currTarget = {
                        id : model.id, 
                        url: model.url
                    };
                    if (model.type === 'file') {
                        this.ctxMenuItems = this.ctxMenuFile;
                    } else if (model.type === 'folder') {
                        this.ctxMenuItems = this.ctxMenuFolder;
                    }
                } else {
                    this.ctxMenuItems = this.ctxMenuCommon;
                }
                this.showMenu = true;
                this.$nextTick(function() {
                    this.$refs.ctxMenu.style.left = (e.pageX - window.pageXOffset) + 'px';
                    this.$refs.ctxMenu.style.top = (e.pageY - window.pageYOffset) + 'px';
                });
            },
            selectCtxItem(e, item) {
                e.stopImmediatePropagation();
                this.showMenu = false; 
                const itemsList = [];

                switch(item) {
                    case 1: 
                        this.copyFiles();
                        break;
                    case 2:
                        this.pasteFiles();
                        break;                   
                    case 3:
                        this.removeFiles();
                        break;
                    case 6:
                        this.createFolder(this.currURL);
                        break;
                    case 7:
                        if (this.$can('role', 'SuperAdmin')) {
                            this.showProperties = true;
                        } else {
                            this.showWarning = true;
                        }
                        break;

                    default:
                        break;
                }      
            }
        },
        created() {
            document.addEventListener('click', () => {
                this.isAnySelected = false;
                this.showProperties = false;
            });
        },
        mounted() {
            const ctx = this;
            this.currFolder = this.treeView[0];
            //init treeView
            this.updateTree(
                this.currURL, 
                () => {}
            );
            //init list of files
            this.updateList(
                this.currURL,
                'null',
                () => {}
            );
            
            //pushing into stack current url
            History.push(
                () => {},
                {
                    url: this.currURL,
                    id: 'null'
                }  
            );

            const deselectFolder = () => {
                this.currFolder.selected = false;
            };

            const goToPath = (url, id) => {
                const nextPath = url;
                this.updateList(
                    nextPath,
                    id,
                    () => {
                        History.push(
                            () => {},
                            {
                                url: nextPath,
                                id: id
                            }
                        );
                    }
                );  
                this.currURL = nextPath;
                this.isAnySelected = false;
            };

            // получение полной ссылки на директорию
            // при клике на элемент дерева
            const treeWalk = model => {
                const url = model.url === '/' ? '' : model.url;
                return model.root? treeWalk(model.root) + '*' + url: url;
            };

            const onTreeWalk = (e, elem) => {
                deselectFolder();
                elem.selected = true;
                this.currFolder = elem;
                this.showMenu = false;
                this.checkIsAnySelected();
                goToPath(treeWalk(elem), elem.id, false);
            };

            const onListUpdate = (url, id) => {
                const path = url === '' ? this.currURL : this.currURL + '*' + url;
                goToPath(path, id);
                deselectFolder();
                this.selectInTree(path, this.treeView[0]);
            };

            const onBackTo = data => {
                if (data === null) return;
                this.updateList(
                    data.url,
                    data.id,
                    () => {}
                );
                this.currURL = data.url;
                deselectFolder();
                this.selectInTree(this.currURL, this.treeView[0]);
            };

            const onFileRename = (id, from, to) => {
                const oldPath = this.currURL + '*' + from;
                const newPath = this.currURL + '*' + to;
                this.httpPost(
                    HTTP_PREFIX + 'api/rename/' + oldPath + '/' + newPath,
                    {
                        id: id,
                        from: from,
                        to: to
                    },
                    data => {
                        this.updateList(
                            this.currURL, 
                            id,
                            () => {}
                        );
                        this.updateTree(
                            this.currURL, 
                            () => {}
                        );
                    }
                );
            };

            const onItemClick = (e, elem) => {
                this.isAnySelected = true;
                this.showMenu = false; 
                for (let i = 0, len = this.elements.length; 
                    (i < len) && !e.ctrlKey && !elem.selected; 
                    i++
                ) {
                    const item = this.elements[i];
                    if (item !== elem) {
                        item.selected = false;
                    }
                }
                if (elem.selected === false) {
                    elem.selected = true;
                }
            };

            const onOpenMenu = (e, model) => { 
                this.openCtxMenu(e, model);
            };

            const onRefreshState = () => {
                this.updateTree(
                    this.currURL, 
                    () => {}
                )
                this.updateList(
                    this.currURL,
                    this.currFolder.id,
                    () => {}
                )
            }

            this.$on('listUpdate', onListUpdate);
            this.$on('fileRename', onFileRename);
            this.$on('openMenu', onOpenMenu);
            this.$on('itemClicked', onItemClick);
            this.$on('refreshState', onRefreshState);
            EventHub.$on('walkTree', onTreeWalk);
            EventHub.$on('backTo', onBackTo);
            EventHub.$on('openMenu', onOpenMenu);

            this.removeEvents = () => {
                this.$off('listUpdate', onListUpdate);
                this.$off('fileRename', onFileRename);
                this.$off('openMenu', onOpenMenu);
                this.$off('itemClicked', onItemClick);
                this.$off('refreshState', onRefreshState);
                EventHub.$off('walkTree', onTreeWalk);
                EventHub.$off('backTo', onBackTo);
                EventHub.$off('openMenu', onOpenMenu);
            }
        },
        beforeDestroy() {
            this.removeEvents();
        },
        components: {
            file: simpleFile,
            folder: simpleFolder,
            fileUploader: FileUploader,
            properties: Properties,
            tree: TreeView,
            modal: Modal
        }
    }

    function getFileList(data) {
        return data.map((el) => {
            const item = el.name;
            let url;

            if (el.type === 'file') {
                let type = item.match(/\.([0-9a-z]+)$/i);
                if (!type || FILE_TYPES.indexOf(type[1]) === -1) {
                    url = 'unknown';
                } else {
                    url = type[1];
                }
            } else {
                url = 'folder'
            }

            const element = {
                name: item,
                url: item,
                image_url: `images/file_type_${url}.png`,
                type: el.type,
                selected: false
            };

            defineProperty(
                element, 
                'id',
                el.id,
                false,
                false
            );

            defineProperty(
                element, 
                'parentId',
                el.parentId,
                false,
                false
            );

            return element;
        }).sort(function(a, b) {
            return (a.type === 'folder') ? -1 : ((b.type === 'folder') ? 1 : 0);
        });
    }

    function getTreeData(data, parent = null) {

        return data.map((el) => {
            const item = el.name;

            const element = {
                name: item,
                url: item,
                selected: false,
                children: [],
                open: false
            };

            defineProperty(
                element, 
                'id',
                el.id,
                false,
                false
            )

            defineProperty(
                element, 
                'parentId',
                el.parentId,
                false,
                false
            )

            defineProperty(
                element, 
                'root',
                parent,
                false,
                false
            )

            if (el.children.length > 0) {
                element.children = getTreeData(el.children, element);
            }
            return element;
        });
    }
    
</script>

<style>

    .container-fluid {
        margin-top: 2px;
    }
    .nav > li > a:hover {
        border-radius: 50px;
        text-decoration: none;
    }

    .navbar .navbar-nav > li > a {
        color: #fff;
    }
    .navbar .navbar-nav > li > a:hover {
        color: black;
    }

    .pb-filemng-template {
        height: 100%;
	    /* margin-top: 40px; */
        font-family: 'Sansita', sans-serif;
    }

    .pb-filemng-navbar {
        border-radius: 0;
        height: 40px;
        background: #34495e;
        margin-bottom: 0;
        box-shadow: 0 0 10px #34495e;
        z-index: 999;
    }

    .treeview-toggle-btn {
	    margin-left: 15px;
    }

    .pb-filemng-template-btn {
	    background-color: transparent;
        background-repeat:no-repeat;
        border: none;
        cursor:pointer;
        outline:none;
        color: gray;
        padding: 0px 13px 0px 13px;
    }

    .pb-filemng-active {
	    border-bottom: 2px solid #6d97db;
	    color: #5f6977;
    }

    .pb-filemng-template-btn:hover {
	    color: blue;
    }

    .pb-filemng-body-folders > img:hover {
	    cursor: pointer;
    }

    .pb-filemng-panel-body {
        min-height: 85%;
        padding: 0 15px;
    }

    .pb-filemng-template-body {
        padding-top: 10px;
        height: 100%;
        overflow-y: auto;
    }

    .pb-filemng-template-treeview {
        padding-top: 10px;
        background-color: #dcdee0;
        /* border-right: 0 solid #e7e7e7;
        border-radius: 4px; */
        /* height: auto; */
        height: 100%;
    }

    .pb-filemng-folder {
	    color: orange;
	    padding-bottom: 3px;
    }

    .img-responsive {
	    margin: 0 auto;
    }

 /* @media screen and (max-width: 767px) {

	.pb-filemng-template-treeview {
		border-right: none;
	}

	#options {
		text-align: center;
	}

	#options > li {
		display: inline-block;
	}

	#pb-filemng-navigation > ul {
		text-align: center;
	}

	#pb-filemng-navigation > ul > li {
		display: inline-block;
	}
}  */
</style>

<style>

    .panel-body {
        /* display: inline-block; */
    }

    .fe-search {
        float: left;
        margin: 5px 25px;
        color: #536a81;
        border-color: #293a4a;
        background-color: #293a4a;
    }

    .fe-submit-button {
        color: white;
        background-color: #1abc9c;
        border-color: #22927c;
    }

    .fe-submit-button:hover {
        outline: none;
        color: white;
    }

    .fe-wrapper {
        width: 100%;
        /* height: 100%; */
    }
    .fe-panel {
        min-height: 60%;
        /* border: 1px solid #B2B2B2; */
        border-radius: 4px;
        background-color: #edeff1;
        height: calc(100% - 50px);
    }
    .fe-editable-text {
        width: 100%;
        margin-top: -10px;
        position: relative;
        background-color: transparent;
        display: inline-block;
        border: none;
        text-align: center;
        word-wrap: break-word;
        text-overflow: ellipsis;
    }
    .fe-editable-text:focus {
        background-color: white !important;
        border:0;
        border-radius:2px;
    }
    
    .fe-item-margin {
        margin-bottom: 10px;
        width: 16.66666666666667%;
    }
    .fe-item {
        display: block;
        height: auto;
        padding: 2px;
        border-radius: 3px;
    }
    .fe-item-wrapper {
        margin: 10px 10px 10px 10px;
    }
    .fe-item-text {
        margin-top: -10px;
	    text-align: center;
        word-wrap: break-word;
        text-overflow: ellipsis;
    }
    .fe-context-items {
        list-style:none;
        margin:0px;
        margin-top:4px;
        padding-left:10px;
        padding-right:10px;
        padding-bottom:3px;
        color: #333333;
    }

    .fe-context-menu > hr { 
        width: 85%; 
        background-color:#E4E4E4;
        border-color:#E4E4E4;
        color:#E4E4E4;
    }
    .fe-context-menu {
        position:fixed;
        border:1px solid #B2B2B2;
        width:150px;      
        background:#F9F9F9;
        /* box-shadow: 3px 3px 2px #E9E9E9; */
        border-radius:4px;
    }

    .fe-context-menu li {
        cursor: pointer;
        padding: 3px;
        padding-left:10px;
        text-align: left;
    }

    .fe-context-items li:hover{
        color: white;
        background: rgba(52, 73, 94, 0.8);
        border-radius: 2px;
    }

    .fe-tree {
        margin: 0 auto;
    }

    .fe-checkbox {
        display: block;
        margin-top: 10px;
        margin-bottom: 12px;
        padding-left: 32px;
        position: relative;
        transition: color .25s linear;
        font-size: 14px;
        min-height: 20px;
        line-height: 1.5;
    }

</style>