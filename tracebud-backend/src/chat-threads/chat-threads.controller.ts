import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { ChatThreadsService } from './chat-threads.service';
import { CreateChatThreadDto } from './dto/create-chat-thread.dto';
import { PostChatMessageDto } from './dto/post-chat-message.dto';

@ApiTags('Chat Threads')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/chat-threads')
export class ChatThreadsController {
  constructor(private readonly chatThreadsService: ChatThreadsService) {}

  private requireTenantId(req: any): string {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) throw new ForbiddenException('Missing tenant claim');
    return tenantId;
  }

  @Get()
  @ApiQuery({ name: 'recordId', required: false })
  @ApiOperation({ summary: 'List chat threads for tenant scope' })
  async listThreads(@Query('recordId') recordId: string | undefined, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.chatThreadsService.listThreads(tenantId, recordId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List chat messages for thread' })
  async listMessages(@Param('id') threadId: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.chatThreadsService.listMessages(threadId, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create chat thread with first message' })
  async createThread(@Body() dto: CreateChatThreadDto, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    return this.chatThreadsService.createThread(dto, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      actorRole: role,
    });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Post chat message to thread' })
  async postMessage(@Param('id') threadId: string, @Body() dto: PostChatMessageDto, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    return this.chatThreadsService.postMessage(threadId, dto, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      actorRole: role,
    });
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve chat thread' })
  async resolveThread(@Param('id') threadId: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    return this.chatThreadsService.resolveThread(threadId, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      actorRole: role,
    });
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen resolved chat thread' })
  async reopenThread(@Param('id') threadId: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    return this.chatThreadsService.reopenThread(threadId, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      actorRole: role,
    });
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive chat thread' })
  async archiveThread(@Param('id') threadId: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    return this.chatThreadsService.archiveThread(threadId, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      actorRole: role,
    });
  }
}
