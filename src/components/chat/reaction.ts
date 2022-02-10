/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import callbackify from "../../helpers/callbackify";
import { formatNumber } from "../../helpers/number";
import { MessagePeerReaction, ReactionCount } from "../../layer";
import appPeersManager from "../../lib/appManagers/appPeersManager";
import appReactionsManager from "../../lib/appManagers/appReactionsManager";
import RLottiePlayer from "../../lib/rlottie/rlottiePlayer";
import SetTransition from "../singleTransition";
import StackedAvatars from "../stackedAvatars";
import { wrapSticker, wrapStickerAnimation } from "../wrappers";

const CLASS_NAME = 'reaction';
const TAG_NAME = CLASS_NAME + '-element';
const REACTION_INLINE_SIZE = 14;
const REACTION_BLOCK_SIZE = 22;

export const REACTION_DISPLAY_INLINE_COUNTER_AT = 2;
export const REACTION_DISPLAY_BLOCK_COUNTER_AT = 4;

export type ReactionLayoutType = 'block' | 'inline';

export default class ReactionElement extends HTMLElement {
  private type: ReactionLayoutType;
  private counter: HTMLElement;
  private stickerContainer: HTMLElement;
  private stackedAvatars: StackedAvatars;
  private canRenderAvatars: boolean;
  private _reactionCount: ReactionCount;

  constructor() {
    super();
    this.classList.add(CLASS_NAME);
  }

  public get reactionCount() {
    return this._reactionCount;
  }
  
  public set reactionCount(reactionCount: ReactionCount) {
    this._reactionCount = reactionCount;
  }

  public get count() {
    return this.reactionCount.count;
  }

  public init(type: ReactionLayoutType) {
    this.type = type;
    this.classList.add(CLASS_NAME + '-' + type);
  }

  public setCanRenderAvatars(canRenderAvatars: boolean) {
    this.canRenderAvatars = canRenderAvatars;
  }

  public render(doNotRenderSticker?: boolean) {
    const hadStickerContainer = !!this.stickerContainer;
    if(!hadStickerContainer) {
      this.stickerContainer = document.createElement('div');
      this.stickerContainer.classList.add(CLASS_NAME + '-sticker');
      this.append(this.stickerContainer);
    }
    
    const reactionCount = this.reactionCount;
    if(!doNotRenderSticker && !hadStickerContainer) {
      const availableReaction = appReactionsManager.getReaction(reactionCount.reaction);
      callbackify(availableReaction, (availableReaction) => {
        const size = this.type === 'inline' ? REACTION_INLINE_SIZE : REACTION_BLOCK_SIZE;
        wrapSticker({
          div: this.stickerContainer,
          doc: availableReaction.center_icon,
          width: size,
          height: size,
          static: true
        });
      });
    }
  }

  public renderCounter() {
    const reactionCount = this.reactionCount;
    const displayOn = this.type === 'inline' ? REACTION_DISPLAY_INLINE_COUNTER_AT : REACTION_DISPLAY_BLOCK_COUNTER_AT;
    if(reactionCount.count >= displayOn || (this.type === 'block' && !this.canRenderAvatars)) {
      if(!this.counter) {
        this.counter = document.createElement(this.type === 'inline' ? 'i' : 'span');
        this.counter.classList.add(CLASS_NAME + '-counter');
      }

      const formatted = formatNumber(reactionCount.count);
      if(this.counter.textContent !== formatted) {
        this.counter.textContent = formatted;
      }

      if(!this.counter.parentElement) {
        this.append(this.counter);
      }
    } else if(this.counter?.parentElement) {
      this.counter.remove();
      this.counter = undefined;
    }
  }

  public renderAvatars(recentReactions: MessagePeerReaction[]) {
    if(this.type === 'inline') {
      return;
    }

    if(this.reactionCount.count >= REACTION_DISPLAY_BLOCK_COUNTER_AT || !this.canRenderAvatars) {
      if(this.stackedAvatars) {
        this.stackedAvatars.container.remove();
        this.stackedAvatars = undefined;
      }

      return;
    }

    if(!this.stackedAvatars) {
      this.stackedAvatars = new StackedAvatars({
        avatarSize: 24
      });

      this.append(this.stackedAvatars.container);
    }

    this.stackedAvatars.render(recentReactions.map(reaction => appPeersManager.getPeerId(reaction.peer_id)));
  }

  public setIsChosen(isChosen = !!this.reactionCount.pFlags.chosen) {
    if(this.type === 'inline') return;
    const wasChosen = this.classList.contains('is-chosen') && !this.classList.contains('backwards');
    if(wasChosen !== isChosen) {
      SetTransition(this, 'is-chosen', isChosen, this.isConnected ? 300 : 0);
    }
  }

  public fireAroundAnimation() {
    callbackify(appReactionsManager.getReaction(this.reactionCount.reaction), (availableReaction) => {
      const size = this.type === 'inline' ? REACTION_INLINE_SIZE + 14 : REACTION_BLOCK_SIZE + 18;
      const div = document.createElement('div');
      div.classList.add(CLASS_NAME + '-sticker-activate');

      Promise.all([
        wrapSticker({
          div: div,
          doc: availableReaction.center_icon,
          width: size,
          height: size,
          withThumb: false,
          needUpscale: true,
          play: false,
          skipRatio: 1,
          group: 'none',
          needFadeIn: false
        }) as Promise<RLottiePlayer>,

        wrapStickerAnimation({
          doc: availableReaction.around_animation,
          size: 80,
          target: this.stickerContainer,
          side: 'center',
          skipRatio: 1,
          play: false
        }).stickerPromise
      ]).then(([iconPlayer, aroundPlayer]) => {
        iconPlayer.addEventListener('enterFrame', (frameNo) => {
          if(frameNo === iconPlayer.maxFrame) {
            iconPlayer.remove();
            div.remove();
          }
        });

        iconPlayer.addEventListener('firstFrame', () => {
          this.stickerContainer.prepend(div);
          iconPlayer.play();
          aroundPlayer.play();
        }, {once: true});
      });
    });
  }
}

customElements.define(TAG_NAME, ReactionElement);
