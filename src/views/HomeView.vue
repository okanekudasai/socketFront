<template>
    <div>
        채팅방 목록
        <button @click="makeRoom">방 만들기</button>
        <hr>
        <div v-if="roomList.length == 0">방없음</div>
        <div v-else>
            <span class="room" v-for="(room, idx) in roomList" :key="idx" @click="enterChat(room)">
                {{room.roomName}}<br>
            </span>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import Stomp from 'webstomp-client'
import SockJS from 'sockjs-client'

export default {
    data() {
        return {
            roomList: [],
        }
    },
    created() {
        this.start();
    },
    methods: {
        start() {
            if(this.$store.state.stompClient) this.subscribeCancel();
            const socket = new SockJS(process.env.VUE_APP_URL + '/realsocket/websocket');
            this.$store.state.stompClient = Stomp.over(socket);
            this.$store.state.stompClient.connect(
                {},
                () => {
                console.log("야호 연결성공요")
                // 모든 구독을 끊어요
                this.subscribeCancel()
                const subscribeId = this.$store.state.stompClient.subscribe("/topic/roomList", (e) => {
                    console.log(e.body)
                    //이 함수를 써서 vue객체의 룸리스트를 업데이트해요
                    console.log("방리스트를 업데이트 할게요")
                    this.updateRoomList();
                    //e로 던저서 e.body로 받았어요
                })
                // 구독 정보를 업데이트해요
                this.$store.state.subscribeList.push(subscribeId);
                this.updateRoomList();
            });
        },
        updateRoomList() {
            axios.get(process.env.VUE_APP_URL + '/realsocket/chatingRoomList').then(({data}) => {
                this.roomList = data;
            })
        },
        subscribeCancel() {
            for(let sub of this.$store.state.subscribeList) {
                this.$store.state.stompClient.unsubscribe(sub.id);
            }
            this.$store.state.subscribeList = [];
        },
        makeRoom() {
            var roomName = prompt("방제목을 입력해주세요");
            if (!roomName) return;
            var userId = prompt("닉네임을 입력해주세요");
            if (!userId) return;
            console.log(roomName, userId)
            //채팅방이름과 내 닉네임을 가지고 채팅방을 만드는 메서드를 호출해요
            axios.post(process.env.VUE_APP_URL + '/realsocket/chatingRoom', {"roomName": roomName, "userId": userId}).then(({data}) => {
                console.log(data)
                sessionStorage.setItem("roomNumber", data)
                // 내가 방을 만든 사실을 계속 방에 있을 구독자들에게 알려줘요
                this.$store.state.stompClient.send("/socket/roomList")
                // 채팅방으로 이동해요
                this.$router.push( {path: '/ChatView/' + roomName + "/" + userId} )
            })
        },
        enterChat(room) {
            console.log(room)
            var userId = prompt("닉네임을 입력해주세요");
            if (!userId) return;
            axios.post(process.env.VUE_APP_URL + '/realsocket/enterChat', {"roomNumber": room.roomNumber, "userId": userId}).then(({data}) => {
                sessionStorage.setItem("roomNumber", room.roomNumber);
                //notification에서 room인스턴스 찾아서 room인스턴스의 users를 return하고 받는 쪽에서는 user를 업데이트
                this.$store.state.stompClient.send("/socket/notification/" + sessionStorage.getItem("roomNumber"))
                this.$router.push( {path: '/ChatView/' + data + "/" + userId} )
            })
        }
    },
};
</script>

<style>
.room:hover {
    cursor: pointer;
}
</style>

