<template>
    <transition name="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="property-container" @click.stop>

                    <div class="modal-header">
                        <slot name="header">
                            <h3> Directory properties </h3>
                        </slot>
                    </div>

                    <div class="modal-body">
                        <slot name="body">
                           <table class="table table-bordered table-striped">
                            <thead>
                                <th>Group</th>
                                <th>Read</th>
                                <th>Write</th>
                            </thead>
                            <tbody>
                                <tr v-for="item in groups" :key="item.name">
                                    <td><input class="fe-editable-field" readonly="" type="text" v-model="item.name"></td>
                                    <td><input class="fe-editable-field fe-checkbox" type="checkbox" v-model="item.read"></td>
                                    <td><input class="fe-editable-field fe-checkbox" type="checkbox" v-model="item.write"></td>
                                </tr>
                            </tbody>
                        </table>
                        </slot>
                    </div>

                    <div class="modal-footer">
                        <slot name="footer">
                            <div class="btn-toolbar">
                                <button class="btn left-block fe-submit-button" @click="handleSubmit">
                                    Apply
                                </button>
                                <button class="btn left-block fe-submit-button" @click="closeAndRefresh">
                                    Ok
                                </button>
                            </div>
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
    import { HTTP_PREFIX } from '../../providers/common'
    
    export default {
        props: ['url', 'target'],
        data(){
            return {
                path: '',
                permissions: [],
                groups: [],
                is_admin : null   
            }
        },
        methods: {
            async httpPost(url, data) {
                const ctx  = this;
                try {
                    const res = await ctx.$http.post(url,
                    {   
                        data: data
                    }, 
                    {
                        headers: {
                            auth: localStorage.getItem('jwt'),
                        }
                    });
                    return res;
                    
                } catch(error) {
                    if (error.response.status === 401) {
                        ctx.logout();
                    }
                }             
            },
            async httpGet(url) {
                const ctx  = this;    
                try {
                    const res = await this.$http.get(url, {
                        headers: {
                            auth: localStorage.getItem('jwt'),
                        }
                    });
                    
                    return res;

                } catch(error) {
                    if (error.response.status === 401) {
                        ctx.logout();
                        return;
                    }
                    throw new Error(error);
                }
            },
            logout() {
                localStorage.setItem('user', null);
                localStorage.setItem('jwt', null);
                this.$router.push('login');
            },
            async getGroups() {

                let list = [];

                let response;

                try {
                    response = await this.httpGet(HTTP_PREFIX + 'groups');
                } catch(e) {
                    return e;
                }

                list = response.data.map((item) => {
                    return {
                        name: item.name,
                        read: true,
                        write: true,
                    };
                });

                this.groups = list;

                response = await this.httpGet(HTTP_PREFIX + 'folder-permission/' + this.target.id);

                if (response.data) {
                    try {
                        const serialized = JSON.parse(response.data.permissions);
                        serialized.sort((a, b) => { 
                            return list.indexOf(a) - list.indexOf(b);
                        });

                        serialized.forEach((item, i) => {
                            this.groups[i].read = item.read === 1;
                            this.groups[i].write = item.write === 1;
                        }); 
                    } catch(e) {
                        console.log(e);
                    }
                }
            },

            async handleSubmit(e) {
                e.preventDefault();

                const processed = [];
                this.groups.forEach((item) => {
                    const group = {
                        name: '',
                        write: 0,
                        read: 0
                    }
                    group.name = item.name;
                    group.read = item.read === true ? 1: 0;
                    group.write = item.write === true ? 1: 0;
                    processed.push(group);
                });

                await this.httpPost(HTTP_PREFIX + 'folder-permission/', {
                    id: this.target.id,
                    permission: JSON.stringify(processed)
                });  
            },
            async closeAndRefresh(e) {
                //await this.handleSubmit(e);
                this.$parent.$emit('refreshState');  // Нужно обновить дерево 
                this.$emit('close');
            }
        },
        created() {
            this.path = this.url + '*' + this.target.url;
            try {
                this.getGroups();
            } catch (err) {
                console.log(err);
            }              
        }       
    }
</script>

<style>
</style>