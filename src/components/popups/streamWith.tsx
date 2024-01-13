/*
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import PopupElement from '.';
import ButtonMenuToggle from '../buttonMenuToggle';
import {_i18n, LangPackKey} from '../../lib/langPack';
import Row from '../row';
import ButtonIcon from '../buttonIcon';
import {copyTextToClipboard} from '../../helpers/clipboard';
import {attachClickEvent} from '../../helpers/dom/clickEvent';
import Icon from '../icon';
import {toastNew} from '../toast';
import type Chat from '../chat/chat';
import {PhoneGroupCallStreamRtmpUrl} from '../../layer';

const className = 'popup-stream-with';
export default class PopupStreamWith extends PopupElement {
  private chatId: number | string;
  private streamRtmpUrl: PhoneGroupCallStreamRtmpUrl | undefined;

  constructor(private readonly chat: Chat) {
    super(className, {
      closable: true,
      overlayClosable: true,
      body: true,
      scrollable: true,
      footer: true,
      title: 'StreamWith.Title'
    });

    this.chatId = this.chat.peerId.toChatId();
    this.construct();
  }

  private async construct() {
    await this.assignStreamRtmpUrl();

    this.renderMenu();
    this.renderContent();
    this.renderFooter();


    // Open Popup
    this.show();
  }

  private async assignStreamRtmpUrl(revoke?: boolean) {
    try {
      this.streamRtmpUrl = await this.chat.managers.appGroupCallsManager.getGroupCallStreamRtmpUrl(this.chatId, revoke);
    } catch(err) {
      toastNew({langPackKey: 'Error.AnError'});
      throw err;
    }
  }

  // Create stream options
  private renderMenu() {
    const menu = ButtonMenuToggle({
      listenerSetter: this.listenerSetter,
      direction: 'bottom-left',
      buttons: [{
        icon: 'flip',
        text: 'StreamWith.Menu.Revoke',
        onClick: async() => {
          await this.assignStreamRtmpUrl(true);
          this.renderContent(true);
        }
      }]
    });

    this.header.append(menu);
  }

  // Create or update stream usage instructions
  private renderContent(update?: boolean) {
    const instructionsContainerClassName = className + '-content-container-instructions-container'

    const serverUrlInstruction: HTMLElement = this.streamRtmpUrl && this.createSharedInstruction({
      icon: 'link',
      hint: 'StreamWith.Instruction.ServerUrl',
      value: this.streamRtmpUrl.url,
      toastText: 'StreamWith.Instruction.ServerUrlCopied'
    });
    const streamKeyInstruction: HTMLElement = this.streamRtmpUrl && this.createSharedInstruction({
      icon: 'lock',
      hint: 'StreamWith.Instruction.StreamKey',
      value: this.streamRtmpUrl.key,
      toastText: 'StreamWith.Instruction.StreamKeyCopied',
      isSecure: true
    });

    if(update) {
      const [instructionsToUpdate] = Array.from(document.querySelectorAll('div.' + instructionsContainerClassName));
      instructionsToUpdate.innerHTML = '';
      instructionsToUpdate.append(
        serverUrlInstruction,
        streamKeyInstruction
      );

      return;
    }

    // Content container
    const contentContainer = document.createElement('div');
    contentContainer.classList.add(className + '-content-container');

    // Instruction description on the top of popup
    const descriptionTop: HTMLElement = this.createInstructionDescription({description: 'StreamWith.InstructionsSubtitle.Top'});
    const descriptionBottom: HTMLElement = this.createInstructionDescription({description: 'StreamWith.InstructionsSubtitle.Bottom'});

    const instructionsContainer: HTMLElement = document.createElement('div');
    instructionsContainer.classList.add(instructionsContainerClassName)

    instructionsContainer.append(
      serverUrlInstruction,
      streamKeyInstruction
    );

    // Compose content
    contentContainer.append(
      descriptionTop,
      instructionsContainer,
      descriptionBottom
    )

    this.scrollable.append(contentContainer);
  }

  private renderFooter() {
    const container = document.createElement('div');
    container.classList.add(className + '-start-streaming-btn-container');

    const btn = document.createElement('button');
    btn.classList.add('btn-primary', 'btn-color-primary');
    _i18n(btn, 'StreamWith.StartStreamingBtn.Caption');

    container.append(btn);

    attachClickEvent(btn, () => this.chat.appImManager.joinGroupCall(this.chat.peerId));

    this.footer.append(container);
  }

  private createInstructionDescription(options: {description: LangPackKey}): HTMLElement {
    const elClassName = className + '-content-container';

    const container = document.createElement('div');
    container.classList.add(elClassName + '-subtitle-container');

    const description= document.createElement('span');
    _i18n(description, options.description);
    description.classList.add(elClassName + '-subtitle-text');

    container.append(description);

    return container;
  }

  private createSharedInstruction(options: {icon?: Icon; value: string; hint: LangPackKey; toastText: LangPackKey; isSecure?: boolean}) {
    const {icon, hint, toastText, value} = options;
    const elClassName = className + '-instruction-container';

    const copyIcon = Icon('copy');
    copyIcon.classList.add(elClassName + '-copy-icon')

    let isSecure = options.isSecure;

    const titleContainer = document.createElement('div');
    titleContainer.classList.add(elClassName+ '-title-container')
    const title = document.createElement('span');
    title.classList.add(elClassName + (isSecure ? '-title-container-title-secure' : '-title-container-title'))
    title.innerText = value;
    titleContainer.append(title);

    const subtitleContainer = document.createElement('div');
    subtitleContainer.classList.add(elClassName+ '-subtitle-container')
    const subtitle = document.createElement('span');
    _i18n(subtitle, hint);
    subtitleContainer.append(subtitle);

    if(options.isSecure) {
      const subtitleSecureBtn = ButtonIcon('eye1', {noRipple: true})
      subtitleSecureBtn.classList.add(elClassName+ '-subtitle-secure-btn')
      subtitleContainer.append(subtitleSecureBtn);
      attachClickEvent(subtitleSecureBtn, (e: MouseEvent) => {
        e.stopPropagation();
        isSecure = !isSecure;
        title.classList.remove(elClassName + (isSecure ? '-title-container-title' : '-title-container-title-secure'))
        title.classList.add(elClassName + (isSecure ? '-title-container-title-secure' : '-title-container-title'))
        subtitleSecureBtn.replaceChildren(Icon(isSecure ? 'eye1' : 'eye2'));
      });
    }

    const copyValueToClipboard = () => {
      copyTextToClipboard(value);
      toastNew({langPackKey: toastText});
    };

    const row = new Row({
      icon: icon,
      title: titleContainer,
      subtitle: subtitleContainer,
      rightContent: copyIcon,
      clickable: copyValueToClipboard
    });

    return row.container;
  }
}
