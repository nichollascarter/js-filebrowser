<template>
    <li class="fe-tree-item">
        <span class="fe-folder-toggle" @click="toggle">
            <div 
                v-if="isFolder" 
                :class="[model.open ? openedClass : closedClass]">
            </div>
        </span>
        <div 
            :class="[model.open && isFolder ? openedFolder : closedFolder]" 
            :style="classState" @click="clickItem($event, model)" 
            @mouseover="hoverItem" 
            @mouseleave="leaveItem" 
        ><!-- @contextmenu.prevent="openMenu"-->
            <span> {{ model.name }}</span>
        </div>
        <ul 
            v-show="model.open" 
            v-if="isFolder">
            <tree 
                class="item" 
                v-for="(model, index) in model.children" 
                :key="index" 
                :model="model">
            </tree>
        </ul>
    </li>
</template>

<script>
    import EventHub from '../../providers/EventHub'

    export default {
        name: 'tree',
        props: {
            model: Object
        },
        data() {
            return {
                open: false,
                isHovered: false,
                customStyle: {
                    color: 'black',
                    background: 'transparent'
                },
                hoverStyle: {
                    color: 'white',
                    background: 'rgba(44, 62, 80, 0.6)'
                },
                selectedStyle: {
                    color: 'white',
                    background: 'rgb(44, 62, 80, 0.9)'
                },
                openedClass: 'fa fa-sort-desc fe-tree-item-toogle',
                closedClass: 'fa fa-caret-right fe-tree-item-toogle',
                openedFolder: 'fa fa-folder-open fe-tree-item-alias',
                closedFolder: 'fa fa-folder fe-tree-item-alias'
            }
        },
        computed: {
            isFolder() {
                return this.model.children &&
                    this.model.children.length
                },
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
            }    
        },       
        methods: {
            toggle() {
                if (this.isFolder) {
                    this.model.open = !this.model.open
                }
            },
            hoverItem() {
                this.isHovered = true;
            },
            leaveItem() {
                this.isHovered = false;    
            },
            clickItem(e, item) {
                e.stopImmediatePropagation();
                EventHub.$emit(
                    'walkTree', 
                    e, 
                    this.model
                );
            },
            openMenu(e) {
                e.stopImmediatePropagation();
                EventHub.$emit(
                    'openMenu', 
                    e, 
                    { 
                        id: this.model.id, 
                        url: this.model.url, 
                        type: 'folder'
                    }
                );
            },
        }            
    }
</script>

<style>
    .fe-tree-item-alias {
        font-size: 14px;
        display: inline-block;
        padding: 4px 4px 4px;
        border-radius: 2px;
        /* width: 80%; */
    }

    .fe-tree-item-alias > span { 
        font-family: "Lato", Helvetica, Arial, sans-serif;
    }

    .fe-tree-item {
        cursor: pointer;
        list-style-type: none;
        margin-left: -15px;
        margin-bottom: 5px;
        margin-top: 5px;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space:nowrap;   
    }

    .fe-tree-item-toogle {
        margin: 0 2px;
    }

    .fe-folder-toggle {
        display: inline-block;
        width: 15px;
    }
</style>

