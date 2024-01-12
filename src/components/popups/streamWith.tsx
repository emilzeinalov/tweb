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

const className = 'popup-stream-with';
export default class PopupStreamWith extends PopupElement {
  constructor() {
    super(className, {
      closable: true,
      overlayClosable: true,
      body: true,
      scrollable: true,
      footer: true,
      title: 'StreamWith.Title'
    });

    this.construct();
  }

  private construct() {
    // Construct Header
    const menu: HTMLElement = this.createMenu();
    this.header.append(menu);

    // Construct Body
    const content: HTMLElement = this.createContent();
    this.scrollable.append(
      content
    );


    // Construct Footer
    const startStreamingBtn: HTMLElement = this.createStartStreamingBtn();

    this.footer.append(
      startStreamingBtn
    );

    // Open Popup
    this.show();
  }

  // Create stream options
  private createMenu(): HTMLElement {
    return ButtonMenuToggle({
      listenerSetter: this.listenerSetter,
      direction: 'bottom-left',
      buttons: [{
        icon: 'bug',
        text: 'StreamWith.TBD',
        onClick: () => {
          console.log('TBD');
        },
        verify: () => true
      }],
      onOpen: async(e, element) => {
        console.log('Do something when open');
      }
    });
  }

  // Create stream usage instructions
  private createContent(): HTMLElement {
    // Content container
    const contentContainer = document.createElement('div');
    contentContainer.classList.add(className + '-content-container');

    // Instruction description on the top of popup
    const descriptionTop: HTMLElement = this.createInstructionDescription({description: 'StreamWith.InstructionsSubtitle.Top'});
    const descriptionBottom: HTMLElement = this.createInstructionDescription({description: 'StreamWith.InstructionsSubtitle.Bottom'});

    const instructionsContainer: HTMLElement = document.createElement('div');
    instructionsContainer.classList.add(className + '-content-container-instructions-container')

    const serverUrlInstruction: HTMLElement = this.createSharedInstruction({
      icon: 'link',
      hint: 'StreamWith.Instruction.ServerUrl', value: 'LINK',
      toastText: 'StreamWith.Instruction.ServerUrlCopied'
    });
    const streamKeyInstruction: HTMLElement = this.createSharedInstruction({
      icon: 'lock',
      hint: 'StreamWith.Instruction.StreamKey',
      value: 'KEY',
      toastText: 'StreamWith.Instruction.StreamKeyCopied',
      isSecure: true
    });

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
    return  contentContainer;
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

  private createStartStreamingBtn(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add(className + '-start-streaming-btn-container');

    const btn = document.createElement('button');
    btn.classList.add('btn-primary', 'btn-color-primary');
    _i18n(btn, 'StreamWith.StartStreamingBtn.Caption');

    container.append(btn);

    return container;
  }
}
