<template>
    <div>
        방이름 : {{this.$route.params.roomName}}<button @click="outChat">나가기</button><br>
        참가자 :
        <span v-for="(user, idx) in userList" :key="idx">
            {{user}}
        </span>
        <hr>
        <input v-model="message" />
        <button @click="submitMessage">전송</button>
        <hr>
        <div>
            <div v-for="(m, idx) in messageList" :key="idx">
                <div v-if="m.nickname">{{m.nickname}} :: {{m.message}} / {{m.date.getHours()}}시 {{m.date.getMinutes()}}분 {{m.date.getSeconds()}}초</div>
                <div v-else>{{m.message}}</div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import Stomp from 'webstomp-client'
import SockJS from 'sockjs-client'
export default {
    data() {
        return {
            userList: [],
            message: "",
            messageList: [],
            routerFlag: false
        }
    },
    created() {
        this.start();
    },
    methods: {
        //시작할 땐 stompClient가 있는지 없는지 검사해봐요 새로고침하면 stompClient가 없어지니까요
        start() {
            //stompClient가 없다면 먼저 stompClient객체를 만들어 줘요
            if (!this.$store.state.stompClient) {
                const socket = new SockJS(process.env.VUE_APP_URL + '/realsocket/websocket');
                this.$store.state.stompClient = Stomp.over(socket);
                this.$store.state.stompClient.connect(
                    {},
                    () => {
                    console.log("야호 연결성공요")
                    this.updateSubscribe();
                });
            }
            //stompClient가 있다면 바로 subscribe를 갱신해요
            else {
                this.updateSubscribe();
            }
        },
        subscribeCancel() {
            for(let sub of this.$store.state.subscribeList) {
                this.$store.state.stompClient.unsubscribe(sub.id);
            }
            this.$store.state.subscribeList = [];
        },
        updateSubscribe() {
            console.log(sessionStorage.getItem("roomNumber"))
            axios.post(process.env.VUE_APP_URL + '/realsocket/findRoom', sessionStorage.getItem("roomNumber"), { headers: {'Content-Type': 'text/plain'}}).then(({data}) => {
                this.userList = data.users;
                // 방리스트에 관한 구독을 끊어요
                this.subscribeCancel()
                // 들어간 채팅방에 대한 구독을 해요
                // 첫 번째 구독은 메세지에 대한 구독이에요
                console.log("data.roomNumber : ", data.roomNumber)
                const messageSubscribeId = this.$store.state.stompClient.subscribe("/topic/message/" + data.roomNumber, (e) => {
                    //메세지를 받았어요 메세지는 e.body에 있고 {message: ~~~, nickname: ~~, date: ~~~}에요
                    var rawData = JSON.parse(e.body);
                    rawData.date = new Date(rawData.date);
                    this.messageList.push(rawData);
                })
                this.$store.state.subscribeList.push(messageSubscribeId);
                // 두 번째 구독은 채팅방 입장 퇴장에 대한 구독이에요
                const NoteSubscribeId = this.$store.state.stompClient.subscribe("/topic/notification/" + data.roomNumber, (e) => {
                    console.log("****************************************")
                    console.log(JSON.parse(e.body));
                    var newList = JSON.parse(e.body);
                    var outbound = this.userList.filter(x => !newList.includes(x))
                    var inbound = newList.filter(x => !this.userList.includes(x))
                    for (var out of outbound) {
                        console.log(out, "가 나갔어")
                        var rawData1 = {
                            message: out + "가 나갔어요"
                        }
                        this.messageList.push(rawData1)
                    }
                    for (var inb of inbound) {
                        console.log(inb, "가 들어왔어")
                        var rawData2 = {
                            message: inb + "가 들어왔어요"
                        }
                        this.messageList.push(rawData2)
                    }
                    //유저 목록을 갱신해요
                    this.userList = newList;
                })
                this.$store.state.subscribeList.push(NoteSubscribeId);
            });
        },
        submitMessage() {
            // 전달할 값은 {아이디: 내아이디, 메세지: this.message}에요
            const data = {
                message : this.message,
                nickname : this.$route.params.userId,
            }
            this.$store.state.stompClient.send("/socket/sendMessage/" + sessionStorage.getItem("roomNumber"), JSON.stringify(data), {})
            this.message = "";
        },
        async outing() {
            alert('나갈게요')
            // 새 핸들러 만들어서 방넘버와 아이디를 주면 방인스턴스의 users에서 아이디 지우고 send()
            // 또 뒤로가기는 따로 처리해야 되니까 outChat에 인자 달아서 버튼을 눌러서 실행되는건지 뒤로가기로 실행되는건지 구분
            await axios.post(process.env.VUE_APP_URL + '/realsocket/outChat', {"roomNumber": sessionStorage.getItem("roomNumber"), "userId": this.$route.params.userId}).then(() => {
                this.$store.state.stompClient.send("/socket/notification/" + sessionStorage.getItem("roomNumber"))
            })
        },
        outChat() {
            this.$router.push('/');
        }
    },
    async beforeRouteLeave (to, from, next) {
        await this.outing();
        next();
    }
};
</script>

<style>
</style>