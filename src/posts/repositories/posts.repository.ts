import { Injectable } from '@nestjs/common';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostsRepository extends Repository<Post> {
  constructor(private readonly dataSource: DataSource) {
    super(Post, dataSource.createEntityManager());
  }

  // 오운완 인증 게시글 생성
  async createPost(
    description: string,
    imgUrl: string,
    challengeId: number,
    userId: number,
  ): Promise<Post> {
    const newPost = await this.create({
      description,
      imgUrl,
      challengeId,
      userId,
    });
    await this.save(newPost);

    return newPost;
  }

  // 오늘 게시글을 올렸는지 확인
  async existTodayPost(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.count({
      where: {
        userId,
        createdAt: MoreThanOrEqual(today),
      },
    });

    return count > 0;
  }

  // 오운완 전체 조회
  async getAllPost(
    challengeId: number,
    page: number,
    pageSize: number,
  ): Promise<
    { imgUrl: string; description: string; username: string; comment: string }[]
  > {
    const allPost = await this.find({
      where: { challengeId },
      select: ['challengeId', 'id', 'description', 'imgUrl', 'createdAt'],
      order: { createdAt: 'DESC' },
      relations: ['user'],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const allPosts = allPost.map((post) => {
      return {
        imgUrl: post.imgUrl,
        description: post.description,
        username: post.user.name,
        comment: post.user.comment,
      };
    });
    return allPosts;
  }

  // 오운완 상세 조회
  async getOnePost(postId: number): Promise<Post> {
    const onePost = await this.findOne({
      where: { id: postId },
    });
    return onePost;
  }

  // 오운완 삭제
  async deletePost(postId: number): Promise<any> {
    const deletePost = await this.delete(postId);

    return deletePost;
  }

  // 유저가 생성한 오운완 수+목록조회
  async getUserPosts(userId: number): Promise<[Post[], number]> {
    return await this.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
