<template>
    <div>
        {{this.$store.state.subscribeList}}<br>
        방이름 : {{this.$route.params.roomName}}<br>
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
                {{m.nickname}} :: {{m.message}} / {{m.date.getHours()}}시 {{m.date.getMinutes()}}분 {{m.date.getSeconds()}}초
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
            messageList: []
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
                const socket = new SockJS('http://localhost:9998/realsocket/websocket');
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
            axios.post("http://localhost:9998/realsocket/findRoom", sessionStorage.getItem("roomNumber"), { headers: {'Content-Type': 'text/plain'}}).then(({data}) => {
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
                    console.log(JSON.parse(e.body));
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
        }
    },
    
};
</script>

<style>
</style>