/**
 * Created by neko on 29.08.16.
 */
/// <reference path="../vendor/jquery.d.ts" />


( function ($) {
    function getList(object:JQuery = $(".acf-wemoda-authors")) {
        let value = object.val();
        if (value) {
            return JSON.parse(value);
        }
        return [];
    }

    function appendInputs(rows:JQuery = $(".acf-wemoda-authors ~ .fields > div.rows"), name:string, label:string, link:string) {
        let row = $("<div>").addClass("row").appendTo(rows).css("display","flex");
        let labelName = $('<label>').appendTo(row).text('Name des Autors').css("margin","1em");
        /*let nameInp = */$('<input type="text">').addClass("name").appendTo(labelName).val(name).on('change', updateData);
        let labelLabel = $('<label>').appendTo(row).text('(Twitter)-Label').css("margin","1em");
        /*let labelInp = */$('<input type="text">').addClass("label").appendTo(labelLabel).val(label).on('change', updateData);
        let labelLink = $('<label>').appendTo(row).text('Link des Labels').css("margin","1em");
        /*let linkInp = */$('<input type="text">').addClass("link").appendTo(labelLink).val(link).on('change', updateData);
        /*let remove = */$('<div>').appendTo(row).text("Autor Entfernen").click(removeAuthor).addClass('button button-primary button-large').css("margin","1em").css("align-self","flex-end");
    }

    function initFields(list = getList(), inputs:JQuery = $(".acf-wemoda-authors ~ .fields")) {
        inputs.html("");
        let rows = $("<div>").appendTo(inputs).addClass("rows");
        $(list).each(function (i, li) {
            appendInputs(rows, li.name, li.label, li.link);
        });
        $("<div>").appendTo(inputs).text('Autor Hinzufügen').click(addNewAuthor).addClass('button button-primary button-large');
    }

    function addNewAuthor(event) {
        // let object = $(event.target);
        appendInputs(void 0, "", "", "");//add blank field
    }

    function removeAuthor(event,authorField:JQuery = $(".acf-wemoda-authors")) {
        let object:JQuery = $(event.target).parent();
        let other = object.parent();
        object.remove();
        let inputs = other.find('input');
        if(!inputs.length){
            authorField.val("");
        }else{
            inputs.trigger("change");
        }
    }

    function updateData(event,authorField:JQuery = $(".acf-wemoda-authors")) {
        let object:JQuery = $(event.target).parents('.rows');//input->label->row->rows
        let data = [];
        object.children('.row').each(function (i, r) {
            let row:JQuery = $(r);
            let name = row.find('.name').val();
            let label = row.find('.label').val();
            let link = row.find('.link').val();
            data.push(
                {
                    'name': name,
                    'label': label,
                    'link': link,
                }
            );
        });
        authorField.val(JSON.stringify(data));
    }

    $(document).ready(function () {
        let authorField = $(".acf-wemoda-authors");
        let authorInputs = $(".acf-wemoda-authors ~ .fields");
        if (authorField.length) {//exists? xd
            let list = getList();
            initFields(list);
        }
    });

}(jQuery) );