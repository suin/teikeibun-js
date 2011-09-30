/**
 * 定型文生成マネージャー
 * jQueryが必要です。
 */
jQuery(function($)
{
	/**
	 * const
	 */
	var TEIKEIBUN_FORM          = '#teikeibunForm'; // 入力フォーム
	var TEIKEIBUN_TABLE         = '#teikeibunTable'; // テーブル
	var TEIKEIBUN_TEMPLATE      = '#teikeibunTemplate'; // テンプレート
	var TEIKEIBUN_COPY_TEXTAREA = '#teikeibunCopyTextarea'; // コピー用テキストエリア
	var PLACEHOLDER_PREFIX      = '例: '; // placehodlerの値に付け加える文字列
	var INPUT_FORM_ELEMENTS     = 'input, select, textarea'; // 入力欄として扱う要素
	var PLACEHODLER_ELEMENTS    = 'span'; // テンプレート中の置き換え部分とみなす要素

	/**
	 * メイン処理
	 */
	var main = function(){
		createTeikeibunForm();
		appendInputFields();
		styleUpTeikeibunTemplate();
		prepareCopyTextarea();
		registerEvents();
	};

	var createTeikeibunForm = function(){
		if ( $(TEIKEIBUN_FORM).length == 0 ) {
			// 入力フォームがなければ作る 
			$('<form />')
				.insertBefore(TEIKEIBUN_TEMPLATE)
				.attr('id', TEIKEIBUN_FORM.substr(1))
			;
		}
		
		// テーブルを作る
		$('<table />')
			.addClass('outer')
			.attr('id', TEIKEIBUN_TABLE.substr(1))
			.appendTo(TEIKEIBUN_FORM)
		;
	};

	/**
	 * 入力フィールドを描画する
	 */
	var appendInputFields = function(){
	
		var titles = {};
	
		$(TEIKEIBUN_TEMPLATE).find('span').each(function(){

			var attributes  = {}; 
			var placeholder = PLACEHOLDER_PREFIX + $(this).text();
			var tag         = 'input';
			var type        = 'text';

			// span要素の属性をすべて取得する
			$.each(this.attributes, function(index, attr) {
				attributes[attr.name] = attr.value;
			});

			// 必須のtitle属性がない場合はエラー
			if ( typeof attributes['title'] == "undefined" || !attributes['title'] ) {
				$(this).text("【エラー】title属性を指定してください!");
				return;
			}

			var title = attributes['title'];

			// 同じ入力欄は作らない
			if ( titles[title] == true ) {
				return;
			}

			// 例の長さからちょうどいいサイズにする
			var length = getTextWidth(placeholder);

			if ( length > 600 ) {
				tag = 'textarea';
				attributes['rows'] = 6;
				attributes['cols'] = 60;
			} else {
				tag = 'input';
				attributes['width'] = length;
			}

			// タグ指定があれば、それを使う
			if ( typeof attributes['tag'] !== "undefined" && attributes['tag'] ) {
				tag = attributes['tag'];
			}

			// type指定があれば、それを使う
			if ( typeof attributes['type'] !== "undefined" && attributes['type'] ) {
				type = attributes['type'];
			}

			// 入力タグを生成する
			var inputTag = $('<'+tag+' type="'+type+'" />')
				.val('')
				.attr('placeholder', placeholder)
				.attr('name', name)
			;

			if ( attributes['width'] && attributes['width'] > 0 ) {
				inputTag.css('width', attributes['width']+'px');
			}

			// 他に属性があれば、それを入力フィールドのタグに引き継ぐ
			$.each(attributes, function(name, value) {

				if ( name == 'type' ) {
					return; // typeは上書きできないのでパス
				}

				if ( name == 'width' ) {
					return; // 幅は他で使うのでパス
				}

				inputTag.attr(name, value);
			});

			var tr = $('<tr />').appendTo(TEIKEIBUN_TABLE);
			var tdTitle = $('<td />').addClass('head').text(attributes['title']).appendTo(tr);
			var tdInput = $('<td />').append(inputTag).appendTo(tr);

			titles[title] = true; // 消し込み
		});
		
		$(TEIKEIBUN_TABLE).find('tr:odd').addClass('odd');
		$(TEIKEIBUN_TABLE).find('tr:even').addClass('even');
	};

	/**
	 * 置き換え部分に色をつける
	 */
	var styleUpTeikeibunTemplate = function() {
		$(TEIKEIBUN_TEMPLATE).find(PLACEHODLER_ELEMENTS).each(function(){
			$(this).addClass('variable').addClass('incomplete');
		});
	};

	/**
	 * コピー用のテキストエリアをレンダリング
	 */
	var prepareCopyTextarea = function(){
		$('<textarea />').insertAfter(TEIKEIBUN_TEMPLATE)
		                 .attr('id', TEIKEIBUN_COPY_TEXTAREA.substr(1))
		                 .hide();
	};

	/**
	 * イベント処理を登録する
	 */
	var registerEvents = function(){
		// 各入力欄: キーアップ時 ＆ 変更時
		$(TEIKEIBUN_FORM).find(INPUT_FORM_ELEMENTS).keyup(changeVariable)
		                                           .change(changeVariable)
		                                           .focus(highlightVariable)
		                                           .blur(dehighlightVariable);

		// テンプレート: クリック時
		$(TEIKEIBUN_TEMPLATE).click(showCopyTextarea);

		// コピー用テキストエリア: フォーカスが外れたとき、キーが押されたとき
		$(TEIKEIBUN_COPY_TEXTAREA).blur(hideCopyTextarea)
		                          .keydown(disableEdit);

		// テンプレートの置き換え部分: クリック時
		$(TEIKEIBUN_TEMPLATE).find(PLACEHODLER_ELEMENTS).click(jumpToInputField);
	};

	/**
	 * 入力値に合わせて、置き換え部分を更新する
	 */
	var changeVariable = function(){
		var title = $(this).attr('title');
		var value = $(this).val();
		var field = $(TEIKEIBUN_TEMPLATE).find('[title='+title+']');

		if ( value == '' ) {
			// もし入力値が空っぽだったら、例を表示する
			var pattern = new RegExp("^"+PLACEHOLDER_PREFIX);
			value = $(this).attr('placeholder').replace(pattern, '');
			field.removeClass('complete').addClass('incomplete');
		} else {
			field.removeClass('incomplete').addClass('complete');
		}

		field.html(value);
	};

	/**
	 * テンプレートを非表示にし、コピー用テキストエリアを表示する
	 */
	var showCopyTextarea = function(){

		var height   = $(TEIKEIBUN_TEMPLATE).height();
		var width    = $(TEIKEIBUN_TEMPLATE).width();
		var content  = $(TEIKEIBUN_TEMPLATE).text();
		
		$(TEIKEIBUN_TEMPLATE).hide();
		$(TEIKEIBUN_COPY_TEXTAREA).show()
		                          .height(height).width(width)
		                          .val(content)
		                          .focus().select();

		return false;
	};

	/**
	 * コピー用テキストエリアを隠し、テンプレートを表示する
	 */
	var hideCopyTextarea = function(){
		$(TEIKEIBUN_TEMPLATE).show();
		$(TEIKEIBUN_COPY_TEXTAREA).hide();
	};

	/**
	 * コピー用テキストエリアへの入力を無効化する
	 */
	var disableEdit = function() {
		return false;
	};

	/**
	 * テンプレートの置き換え部分をクリックしたら、入力フィールドにカーソルをフォーカスする
	 */
	var jumpToInputField = function() {
		var title = $(this).attr('title');
		$(TEIKEIBUN_FORM).find('[title='+title+']').focus();
		return false;
	};

	var highlightVariable = function() {
		var title = $(this).attr('title');
		$(TEIKEIBUN_TEMPLATE).find('[title='+title+']').addClass('editing');
	};

	var dehighlightVariable = function() {
		var title = $(this).attr('title');
		$(TEIKEIBUN_TEMPLATE).find('[title='+title+']').removeClass('editing');
	};

	/**
	 * 文字の幅をpxで返す
	 */
	var getTextWidth = function(string) {
		var span = $('<span />').text(string).appendTo('body');
		var width = span.width();
		span.remove();
		return width;
	};

	main(); // メイン処理実行
});
