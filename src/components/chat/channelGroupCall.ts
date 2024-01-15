import type ChatTopbar from './topbar';
import DivAndCaption from '../divAndCaption';
import PinnedContainer from './pinnedContainer';
import Chat from './chat';
import {attachClickEvent} from '../../helpers/dom/clickEvent';
import {_i18n} from '../../lib/langPack';
import {GroupCall} from '../../layer';
import {AppManagers} from '../../lib/appManagers/managers';
import Button from '../button';
import rootScope from '../../lib/rootScope';
import groupCallsController from '../../lib/calls/groupCallsController';

const className ='chat-group-call';
const divAndCaptionClassname ='pinned-group-call-actions';
export default class ChannelGroupCall extends PinnedContainer {
  protected peerId: PeerId;
  protected groupCall: GroupCall;
  constructor(protected topbar: ChatTopbar, protected chat: Chat, protected managers: AppManagers) {
    super({
      topbar,
      chat,
      listenerSetter: topbar.listenerSetter,
      className: className,
      divAndCaption: new DivAndCaption(
        divAndCaptionClassname
      ),
      floating: true,
      closeable: false
    });

    this.divAndCaption.content.remove();

    this.listenerSetter.add(rootScope)('group_call_update', (groupCall) => {
      if(!this.peerId || !groupCall) return;

      this.set(this.peerId, groupCall)();
    });
  }

  public unset(peerId: PeerId) {
    this.peerId = peerId;
    this.toggle(true);
  }

  public set(peerId: PeerId, groupCall: GroupCall) {
    if(groupCall._ === 'groupCallDiscarded') {
      return () => this.unset(peerId);
    }

    return () => {
      this.peerId = peerId;
      this.groupCall = groupCall;
      this.renderContent();
      this.toggle(this.isInChatGroupCall);
    };
  }

  private renderContent() {
    if(!this.groupCall || this.groupCall._ === 'groupCallDiscarded') {
      return;
    }


    const streamingInfoTitle = document.createElement('span');
    _i18n(streamingInfoTitle, 'ChatGroupCall.PinnedBar.Title');
    streamingInfoTitle.classList.add(divAndCaptionClassname + '-container-stream-info-title');

    const streamingInfoSubtitle = document.createElement('span');
    _i18n(streamingInfoSubtitle, 'ChatGroupCall.PinnedBar.Subtitle', [this.groupCall.participants_count]);
    streamingInfoSubtitle.classList.add(divAndCaptionClassname + '-container-stream-info-subtitle');

    const streamingInfo = document.createElement('div');
    streamingInfo.classList.add(divAndCaptionClassname + '-container-stream-info');
    streamingInfo.append(streamingInfoTitle, streamingInfoSubtitle)

    const joinBtn: HTMLElement = Button('pinned-actions-button', {
      text: 'ChatGroupCall.PinnedBar.Join'
    })
    const quoteLikeContainer: HTMLElement = document.createElement('div');
    quoteLikeContainer.classList.add(divAndCaptionClassname + '-container-quote-like', 'quote-like', 'quote-like-border', 'rp');
    quoteLikeContainer.append(
      streamingInfo,
      joinBtn
    );

    const container: HTMLElement = document.createElement('div');
    container.classList.add(divAndCaptionClassname + '-container');
    container.append(quoteLikeContainer);


    attachClickEvent(container, () => {
      this.chat.appImManager.joinGroupCall(this.peerId, this.groupCall.id, true);
    });

    this.wrapper.replaceChildren(container, this.wrapperUtils);
  }

  private get isInChatGroupCall(): boolean {
    const currentGroupCall = groupCallsController.groupCall;
    const chatId = this.peerId.toChatId();
    return currentGroupCall?.chatId === chatId;
  }

  public async setPeerId(peerId: PeerId) {
    if(!this.chat.isChannel) return;
    const {call} = await this.chat.managers.appProfileManager.getChatFull(peerId.toChatId());

    if(!call || call._ !== 'inputGroupCall') return ;

    const groupCall = await this.chat.managers.appGroupCallsManager.getGroupCall(call.id)
    if(!groupCall || groupCall._ !== 'groupCall')   return;

    return this.set(peerId, groupCall as GroupCall);
  }

  public destroy() {
    // TBD
  }
}
