import {
  Injectable,
  NotImplementedException,
  Logger,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { FollowsRepository } from '../repositories/follows.repository';
import { followInitcache as followCache } from '../cache/follow.cache';
import { Request } from '../followInfo';
import { InjectRepository } from '@nestjs/typeorm';
import { FollowMessage } from '../entities/followMessage.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);
  constructor(
    private readonly followRepository: FollowsRepository,
    @InjectRepository(FollowMessage)
    private followMessageRepository: Repository<FollowMessage>,
  ) {}

  //친구요청 기능 - 친구 요청 메세지 캐싱
  async requestFollow(followId: number, user) {
    if (followId === user.id) {
      throw new NotAcceptableException('수행할 수 없는 요청입니다.');
    }

    const existFollow = await this.followRepository.getFollowById(
      followId,
      user.id,
    );
    const existFollowUser = await this.followRepository.getFollowById(
      user.Id,
      followId,
    );

    if (existFollow || existFollowUser) {
      throw new NotAcceptableException('수행할 수 없는 요청입니다');
    }

    const message = `${user.name}(${user.email})님이 친구요청을 보냈습니다`;

    this.followMessageRepository.create({
      userId: user.id,
      followId,
      email: user.email,
      message,
    });
  }

  //user의 보류중인 초대목록 전체 조회
  async getUsersRequests(userId: number) {
    const requests: Request[] = followCache.get(`follow_${userId}`);

    if (requests && requests.length > 0) {
      this.logger.debug('Request 캐시 GET 성공');
      return requests;
    }

    this.logger.error('Request 캐시 GET 실패');
    throw new NotFoundException('캐싱된 데이터가 없습니다.');
  }

  //친구 수락여부 결정   data.response 의  yes or no  여부로 수락 or 취소 결정
  // follow 생성과 동시에 캐싱된 수락메세지 삭제
  async acceptFollow(userId: number, followId: number, response) {
    const results: Request[] = followCache.get(`follow_${followId}`);

    if (!results || results.length <= 0) {
      this.logger.error('캐싱 GET 실패');
      throw new NotFoundException('해당 데이터를 찾지 못했습니다.');
    }

    const getRequest = results.find((res) => res.userId === userId);
    const newResults = results.filter((res) => res.userId !== userId);
    const setResults = followCache.set(`follow_${followId}`, newResults);

    if (response === 'yes') {
      const followResult = await this.followRepository.createFollow(
        followId,
        userId,
      );

      if (!followResult) {
        throw new NotImplementedException('해당 작업을 수행하지 못했습니다.');
      }

      if (setResults) {
        this.logger.debug('Request 캐싱 SET 성공');
        return followResult;
      }
      this.logger.error('Request SET 실패');
      throw new NotImplementedException('요청된 기능을 수행하지 못했습니다.');
    }

    if (!setResults) {
      throw new NotImplementedException('해당 작업을 수행하지 못했습니다.');
    }

    const newMessage = `${getRequest.name}(${getRequest.email})님이 친구요청을 거부했습니다.`;
    //소켓 (newMessage)

    return { newMessage };
  }

  //친구 취소 ,  follow삭제
  async deleteFollow(userId, followId) {
    if (userId === followId) {
      throw new NotAcceptableException('수행할 수 없는 요청입니다');
    }
    const deletedResult = await this.followRepository.deleteFollower(
      userId,
      followId,
    );

    if (!deletedResult.affected) {
      throw new NotImplementedException('요청기능 수행 실패');
    }

    return deletedResult;
  }
}
