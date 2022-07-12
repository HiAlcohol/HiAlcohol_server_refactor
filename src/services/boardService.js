import { db } from "../../config/db.js";

const BoardService = {
  /** 게시글 생성 함수
   * 
   * @param {Number} userId - 글 쓴 유저
   * @param {String} title - 글 제목
   * @param {String} content - 내용 
   * @returns createdPost
   */
  create: async ({ userId, title, content, images }) => {
    const createQuery = `
      insert into post(userId, title, content, images, createdate)
      values(?, ?, ?, ?, now())
    `;
    const post = await db.query(createQuery, [userId, title, content, images]);
    const createdPostId = post[0].insertId;
    const getCreatedPostQuery = `
      select p.id, u.nickname, p.title, p.content, p.images, p.createdate
      from post as p
      join user as u on u.id = p.userId
      where p.id = ?
    `;
    const createdPost = await db.query(getCreatedPostQuery, [createdPostId]);
    return createdPost[0][0];
  },

  /** 게시글 이미지 추가 함수
   * 
   * @param {Array} images - 글 이미지 
   * @returns createdPost
   */
  createImages: async ({ id, images }) => {
    const createQuery = `
      UPDATE post set images = ?
      WHERE id = ?
    `;
    await db.query(createQuery, [images, id]);

    const getPostQuery = `
      SELECT p.id, u.nickname, p.title, p.content, p.images, p.createdate
      FROM post as p
      JOIN user as u ON u.id = p.userId
      WHERE p.id = ?
    `;
    const createdPost = await db.query(getPostQuery, [id]);
    return createdPost[0][0];
  },

  /** 전체 글 조회 함수
   * 
   * @returns postList
   */
  findPostList: async () => { 
    const getPostListQuery = `
      SELECT p.id, u.nickname, p.title, p.content, p.createdate
      FROM post as p
      JOIN user as u ON u.id = p.userId
      WHERE blind = 0
    `;
    const [postList] = await db.query(getPostListQuery);
    return postList;
  },

  /** 글 존재 확인 함수
   * 
   * @param {INTEGER} postId - 글 id
   * @returns post
   */
  findPost: async ({ postId }) => {
    const getPostQuery = `
      SELECT p.id, p.userId, u.nickname, p.title, p.content, p.images, p.createdate
      FROM post as p
      JOIN user as u ON u.id = p.userId
      WHERE p.id = ?
      AND p.blind = 0
    `;
    const post = await db.query(getPostQuery, [postId]);
    return post[0][0];
  },

  /** 글 수정 함수
   * 
   * @param {INTEGER} id - 글 id 
   * @param {Object} toUpdate - 업데이트할 글 정보
   * @returns updatedUser
   */
  updatePost: async ({ id, toUpdate }) => {
    const updatePostQuery = `
      update post set title = ?, content = ?, updatedate = now()
      where id = ?
    `;
    const updatedPost = await db.query(updatePostQuery, [toUpdate.title, toUpdate.content, id]);
    return updatedPost;  
  },

  removePost: async ({ id }) => {
    const deletePostQuery = `
      update post set updatedate = now(), blind = 2
      where id = ?
    `;
    const deletedPost = await db.query(deletePostQuery, [id]);
    return deletedPost;
  },

  /** 글에 달린 댓글 조회 함수
   * 
   * @param {Number} postId - 글 id 
   * @returns comments
   */
  getPostComments: async ({ postId }) => {
    const getCommentQuery = `
      SELECT c.id, c.userId, u.nickname, p.id as postId, c.content, c.createdate
      FROM comment as c
      JOIN post as p ON p.id = c.postId
      JOIN user as u ON u.id = c.userId
      WHERE c.postId = ?
      AND c.blind = 0
    `;
    const comments = await db.query(getCommentQuery, [postId]);
    return comments[0];
  },
};


export { BoardService };