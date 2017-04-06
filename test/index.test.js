import {document} from 'global';

import QUnit from 'qunitjs';
import sinon from 'sinon';
import videojs from 'video.js';

import plugin from '../src/js/index.js';

const Player = videojs.getComponent('Player');

QUnit.module('sanity tests');

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

QUnit.module('videojs-video-playback-quality', {

  beforeEach() {

    // Mock the environment's timers because certain things - particularly
    // player readiness - are asynchronous in video.js 5. This MUST come
    // before any player is created; otherwise, timers could get created
    // with the actual timer methods!
    this.clock = sinon.useFakeTimers();

    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('plugin is registered and adds getVideoPlaybackQuality API', function(assert) {
  assert.strictEqual(
    typeof Player.prototype.videoPlaybackQuality,
    'function',
    'videojs-video-playback-quality plugin was registered'
  );

  assert.notOk(this.player.getVideoPlaybackQuality,
               'no API before plugin is initialized');

  this.player.videoPlaybackQuality();
  this.clock.tick(1);

  assert.ok(this.player.getVideoPlaybackQuality, 'API set after plugin is initialized');
});

QUnit.test('can get dropped and total video frames', function(assert) {
  this.player.videoPlaybackQuality();
  this.clock.tick(1);

  const videoPlaybackQuality = this.player.getVideoPlaybackQuality();

  assert.equal(typeof videoPlaybackQuality,
               'object',
               'getVideoPlaybackQuality returns an object');
  assert.equal(typeof videoPlaybackQuality.droppedVideoFrames,
               'number',
               'droppedVideoFrames is a number');
  assert.equal(typeof videoPlaybackQuality.totalVideoFrames,
               'number',
               'totalVideoFrames is a number');
});

QUnit.test('calls tech method for flash', function(assert) {
  this.player.videoPlaybackQuality();
  this.clock.tick(1);

  const flashResult = { test: 'test' };

  // mock flash tech and response
  this.player.techName_ = 'Flash';
  this.player.tech_.getVideoPlaybackQuality = () => flashResult;

  const videoPlaybackQuality = this.player.getVideoPlaybackQuality();

  assert.equal(videoPlaybackQuality, flashResult, 'called the tech\'s method');
});
