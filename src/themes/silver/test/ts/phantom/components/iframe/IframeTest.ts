import { ApproxStructure, Assertions } from '@ephox/agar';
import { Composing, GuiFactory } from '@ephox/alloy';
import { UnitTest } from '@ephox/bedrock';
import { Option } from '@ephox/katamari';

import { renderIFrame } from '../../../../../main/ts/ui/dialog/IFrame';
import { GuiSetup } from '../../../module/AlloyTestUtils';
import { RepresentingSteps } from '../../../module/ReperesentingSteps';
import { PlatformDetection } from '@ephox/sand';

UnitTest.asynctest('IFrame component Test', (success, failure) => {
  if (PlatformDetection.detect().browser.isIE()) {
    // tslint:disable-next-line:no-console
    console.log('Warning: test needs to be fixed to handle IE special casing');
    success();
    return;
  }
  GuiSetup.setup(
    (store, doc, body) => {
      return GuiFactory.build(
        renderIFrame({
          type: 'iframe',
          name: 'frame-a',
          label: Option.some('iframe label'),
          colspan: Option.none(),
          sandboxed: true,
          flex: false
        })
      );
    },
    (doc, body, gui, component, store) => {

      const frame = Composing.getCurrent(component).getOrDie(
        'Could not find internal frame field'
      );

      return [
        // TODO: Make a webdriver test re: keyboard navigation.
        Assertions.sAssertStructure(
          'Checking initial structure',
          ApproxStructure.build((s, str, arr) => {
            const labelStructure = s.element('label', {
              classes: [ arr.has('tox-label') ],
              html: str.is('iframe label')
            });

            const iframeStructure = s.element('div', {
              classes: [ arr.has('tox-navobj') ],
              children: [
                s.element('div', {
                  attrs: {
                    'data-alloy-tabstop': str.is('true')
                  }
                }),
                s.element('iframe', {
                  classes: [ ],
                  attrs: {
                    // Should be no source.
                    src: str.none()
                  }
                }),
                s.element('div', {
                  attrs: {
                    'data-alloy-tabstop': str.is('true')
                  }
                })
              ]
            });

            return s.element('div', {
              classes: [ arr.has('tox-form__group') ],
              children: [ labelStructure, iframeStructure ]
            });
          }),
          component.element()
        ),

        RepresentingSteps.sSetValue('Setting to a paragraph', frame, '<p><span class="me">Me</span></p>'),

        // Can't check content inside the iframe due to permission issues.
        // So instead, check that there is a source tag now.
        Assertions.sAssertStructure(
          'Checking to see that the src tag is now set on the iframe',
          ApproxStructure.build((s, str, arr) => {
            return s.element('iframe', {
              classes: [ ],
              attrs: {
                // Should be no source.
                src: str.startsWith('data:text/html')
              }
            });
          }),
          frame.element()
        )
      ];
    },
    success,
    failure
  );
});