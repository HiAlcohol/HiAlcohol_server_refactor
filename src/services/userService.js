import { db } from "../../config/db.js";

import axios from "axios";
import jwt from "jsonwebtoken";

const UserService = {
  /** 회원 생성 함수
   * 
   * @param {Object} newUser - 생성할 회원 Object 
   * @returns createNewUser
   */
  upsertKakaoUser: async ({ code }) => {
    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URL = "http://localhost:5000/users";
    
    //카카오 토큰 받기
    const ret = await axios.post(
      `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URL}&code=${code}`,
    );

    const kakaoToken = ret.data.access_token;

    //카카오 유저정보 받기
    const kakaoData = await axios.get(`https://kapi.kakao.com/v2/user/me`, {
      headers: { Authorization: `Bearer ${kakaoToken}` },
    });

    let userData = {
      kakaoid: kakaoData.data.id,
      profile_url: kakaoData.data.kakao_account.profile.thumbnail_image_url,
      nickname: kakaoData.data.kakao_account.profile.nickname,
    };

    // 유저가 존재하는지 확인
    const isUserExistQuery = `
      select *
      from user
      where kakaoid = ?
    `;
    const isUserExist = await db.query(isUserExistQuery, [userData.kakaoid]);

    if (!isUserExist) {
      // 최초 로그인, 디비에 새로 생성
      const createUserQuery = `
        insert into user(kakaoid, profile_url, nickname)
        values(?, ?, ?)
      `;
      const createdUser = await db.query(createUserQuery, [userData.kakaoid, userData.profile_url, userData.nickname]);
      const createdUserId = createdUser[0].insertId;
      
      const isUserExistQuery = `
        select *
        from user
        where id = ?
      `;
      userData = await db.query(isUserExistQuery, [createdUserId]);
    }

    // 로그인 성공 -> JWT 웹 토큰 생성
    const secretKey = process.env.JWT_SECRET_KEY || "jwt-secret-key";
    const token = jwt.sign({ id: user.id }, secretKey);

    const loginUser = {
      id,
      kakaoid,
      profile_url: userData.profile_url,
      nickname: userData.nickname,
      token,
    };

    return loginUser;
  },

  /** 회원 존재 확인 함수
   * 
   * @param {INTEGER} id - 회원 id
   * @returns user
   */
  getUserInfo: async ({ id }) => {
    const isUserExistQuery = `
      select id, kakaoid, profile_url, nickname, role
      from user
      where id = ?
    `;
    const isUserExist = await db.query(isUserExistQuery, [id]);
    return isUserExist[0];
  },

  /** 회원 정보 수정 함수
   * 
   * @param {INTEGER} id - 회원 id 
   * @param {Object} toUpdate - 업데이트할 유저 정보
   * @returns updatedUser
   */
  editUserNickname: async ({ id, toUpdate }) => {
    const updateUserQuery = `
      update user set nickname = ?
      where id = ?
    `;

    await db.query(updateUserQuery, [toUpdate.nickname, id]);

    const getUpdatedUserQuery = `
      select *
      from user
      where id = ?
    `;

    const updatedUser = await db.query(getUpdatedUserQuery, [id]);
    return updatedUser[0];
  },

  /** 회원 프로필 이미지 수정 함수
   * 
   * @param {Number} id - 회원 id 
   * @toUpdate {Object} toUpdate - 업데이트할 회원 정보 
   * @returns updatedUser
   */
  editUserImage: async ({ id, toUpdate }) => {
    const updateUserQuery = `
      update user set profile_url = ?
      where id = ?
    `;

    await db.query(updateUserQuery, [toUpdate.profile_url, id]);

    const getUpdatedUserQuery = `
      select *
      from user
      where id = ?
    `;

    const updatedUser = await db.query(getUpdatedUserQuery, [id]);
    return updatedUser[0];
  },

  /** 회원이 작성한 꿀조합 게시글 조회 함수
   * 
   * @param {Number} id - 회원 id
   * @returns userPosts
   */
  getUserBoard: async ({ id }) => { 
    const getUserBoardQuery = `
      SELECT p.id postId, u.id userId, u.nickname, p.title, p.createdate
      FROM post as p
      JOIN user as u
      ON p.userId = u.id
      AND u.id = ?
      ORDER BY p.createdate DESC
    `;
    const [userPosts] = await db.query(getUserBoardQuery, [id]);
    return userPosts;
  }, 

  /** 회원이 누른 좋아요 목록 조회 함수
   * 
   * @param {Number} id - 회원 id 
   * @return userLikes
   */
  getUserLike: async ({ userId }) => { 
    const getUserBoardQuery = `
    SELECT post.*, count(liked.id) 'count'
    FROM (
      SELECT post.id 'postId', user.id 'userId', user.nickname 'nickname', post.title, post.createdate
      FROM post, user
      WHERE post.userId = user.id
      AND post.blind = 0
    ) post 
    LEFT JOIN liked ON post.postId = liked.postId
    GROUP BY post.postId
  `;
    let [userLikes] = await db.query(getUserBoardQuery, [userId]);

    const likeCheckQuery = `
      SELECT userId 
      FROM liked
      WHERE userId = ? 
      AND postId = ?
    `;
    
    for (var i = 0; i < userLikes.length; i++) {
      const [likeCheck] = await db.query(likeCheckQuery, [userId, userLikes[i].postId]);
      if (likeCheck.length > 0) {
        Object.assign(userLikes[i], { "likeSelection": true });
      } else {
        delete userLikes[i];
      }
    }

    // 위에서 delete 되었다면 null로 남아있음 => filter로 null 제거
    userLikes = userLikes.filter((el) => {
      return el != null;
    });

    return userLikes;
  },
};


export { UserService };