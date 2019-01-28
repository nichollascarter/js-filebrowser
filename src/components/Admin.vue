<template>
    <div>
        <modal v-if="show_modal" @close="show_modal = false" :groups="groups"></modal>
        <div id="members">
            <div class="col-md-8 col-md-offset-2">
                <div class="row">
                    <div class="col-md-12">
                        <h2>Member List
                        <button @click.stop="addMember" class="btn btn-primary pull-right">
                            <span class="glyphicon glyphicon-plus"></span> Member
                        </button>
                        </h2>
                    </div>
                </div>
                <table class="table table-bordered table-striped">
                    <thead>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Group</th>
                        <th>Change password</th>
                        <th></th>
                    </thead>
                    <tbody>
                        <tr v-for="member in members" :key="member.email">
                            <td>
                                <input @blur="updateSettings($event,member)" class="fe-editable-field" type="text" v-model="member.name">
                            </td>
                            <td>
                                <input class="fe-editable-field" type="text" readonly :value="member.email">
                            </td>
                            <td>
                                <select class="fe-editable-field" v-model="member.group" @change="updateSettings($event,member)">
                                    <option v-for="item in groups" :key="item.name" :value="item.name">{{item.name}}</option>
                                </select>
                            </td>
                            <td>
                                <input type="password" @blur="updateUserPass($event, member)" class="fe-editable-field" >
                            </td>
                            <td>
                                <!--<button class="btn btn-success"><span class="glyphicon glyphicon-edit"></span> Edit</button> -->
                                <button class="btn btn-danger" @click="removeUser(member.email)">
                                    <span class="glyphicon glyphicon-trash">
                                    </span> Delete
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import Modal from './Admin/Register'
    import { HTTP_PREFIX } from '../providers/common'

    export default {
        props : ["nextUrl"],
        components : {
            modal: Modal
        },
        data(){
            return {
                name : "",
                email : "",
                password : "",
                password_confirmation : "",
                group: '',
                groups: [],
                is_admin : null,
                members: [],
                show_modal: false
            }
        },
        methods: {
            httpPost(url, data, callback) {
                const ctx  = this;
                ctx.$http.post(url,
                data, 
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    callback(
                        response.data
                    );
                })
                .catch(ctx.httpErrorProcess);
            },
            httpGet(url, callback) {
                const ctx  = this;
                this.$http.get(url,
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    callback(
                        response.data, 
                        response.headers['content-type']
                    );
                })
                .catch(ctx.httpErrorProcess)
            },
            httpDelete(url, callback) {
                const ctx  = this;
                this.$http.delete(url,
                {
                    headers: {
                        auth: localStorage.getItem('jwt'),
                    }
                })
                .then(response => {
                    callback(
                        response.data, 
                        response.headers['content-type']
                    );
                })
                .catch(ctx.httpErrorProcess);
            },
            httpErrorProcess(err) {
                if (err.response.status === 401) {
                    return this.logout();
                }
            },
            logout() {
                localStorage.setItem('user', null);
                localStorage.setItem('jwt', null);
                this.$router.push('login');
            },
            updateSettings(e, member) {
                e.stopImmediatePropagation();
                this.httpPost(HTTP_PREFIX + 'update-user', 
                    {
                        name: member.name,
                        email: member.email,
                        group: member.group
                    }, () => {

                });
            },
            updateUserPass(e, member) {
                e.stopImmediatePropagation();
                if (e.target.value === '') return;
                this.httpPost(HTTP_PREFIX + 'set-user-pass', 
                    {
                        password: e.target.value,
                        email: member.email
                    }, 
                    () => {

                });
                e.target.value = '';
            },
            handleSubmit(e) {
                e.preventDefault();

                if (this.password === this.password_confirmation && this.password.length > 0) {                 
                    this.httpPost(HTTP_PREFIX + 'register', {
                        name: this.name,
                        email: this.email,
                        group: this.group,
                        password: this.password,
                        is_admin: this.is_admin
                    }, response => {
                        this.getUserList();
                    });
                } else {
                    this.password = '';
                    this.passwordConfirm = '';
                    return alert("Passwords do not match")
                }
            },
            removeUser(email) {
                this.httpDelete(
                    HTTP_PREFIX + 'user/' + email,
                    response => {
                        this.getUserList();
                })
            },
            getUserList() {
                const ctx = this;
                const list = [];

                this.httpGet(
                    HTTP_PREFIX + 'users', 
                    data => {
                        data.forEach((item) => {
                            list.push({
                                name: item.name,
                                email: item.email,
                                group: item.user_group
                            });
                    })
                    ctx.members = list;
                }, () => {

                })
            },
            getGroupList() {
                const ctx = this;
                const list = [];

                this.httpGet(HTTP_PREFIX + 'groups', data => {
                    data.forEach((item) => {
                        list.push({
                            name: item.name,
                            download: item.download === 1,
                            ipload: item.upload === 1,
                            remove: item.remove === 1,
                            permission: item.permission,
                            pass: ''
                        });
                    })
                    ctx.groups = list;
                });
            },
            addMember(e) {
                this.show_modal = true;
            },
            pageClick() {
                this.show_modal = false;
            } 
        },
        created() {
            document.addEventListener('click', () => {
                this.show_modal = false;
            })
            const ctx = this;
            this.getUserList();
            this.getGroupList();
        },
        mounted() {
            this.$on('onRegister', this.getUserList);

            this.removeEvents = () => {
                this.$off('onRegister', this.getUserList);
            }
        },
        beforeDestroy() {
            this.removeEvents();
        }
    }
</script>

<style>

    table {
        border: 1px solid black;
        border-radius: 4px;
        border-collapse: collapse;
        -moz-border-radius: 4px;
        -webkit-border-radius: 4px;
    }
    thead {
        background: #34495e;
        margin-bottom: 0;
        color: white;
        line-height: 40px;
    }
    th {
        margin: 5px;
    }
    .fe-modal-dialog {
        display: block;
        width: 25%;
        position: absolute;
        z-index: 9999;
        background-color: white;
        left: 35%;
        border-radius: 10px;
        border: 1px solid black;
    }
    .fe-editable-field {
        width: 100%;
        margin-top: 5px;
        display: inline-block;
        position: relative;
        border: 0;
        background-color: transparent;
    }

</style>