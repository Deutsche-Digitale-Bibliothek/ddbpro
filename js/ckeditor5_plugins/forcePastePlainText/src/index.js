// eslint-disable-next-line import/no-extraneous-dependencies
import { Plugin } from 'ckeditor5/src/core';
import plainTextToHtml from '@ckeditor/ckeditor5-clipboard/src/utils/plaintexttohtml';

class EditorForcePastePlainText extends Plugin {

  /**
   * @inheritdoc
   */
  static get pluginName() {
    return 'EditorForcePastePlainText';
  }

  init() {
    const editor = this.editor;
    const editingView = editor.editing.view;
    editingView.document.on('clipboardInput',(evt, data) => {
      if (editor.isReadOnly) {
        return;
      }

      const dataTransfer = data.dataTransfer;
      const content = plainTextToHtml(dataTransfer.getData('text/plain'));

      data.content = this.editor.data.htmlProcessor.toView(content);
    });
  }

}

export default {
  EditorForcePastePlainText,
};
