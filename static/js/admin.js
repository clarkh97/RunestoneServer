var assignment_release_states = null;

function gradeIndividualItem() {
    //This function figures out the parameters to feed to getRightSideGradingDiv, which does most of the work
    var sel1 = document.getElementById("gradingoption1");
    var val1 = sel1.options[sel1.selectedIndex].value;
    var sel2 = document.getElementById("gradingoption2");
    var val2 = sel2.options[sel2.selectedIndex].value;
    var sel3 = document.getElementById("gradingoption3");
    var val3 = sel3.options[sel3.selectedIndex].value;

    set_release_button();

    var col3 = document.getElementById("gradingcolumn3");
    var col3val = col3.options[col3.selectedIndex].value;

    var rightSideDiv = $('#rightsideGradingTab');
    var student_dict = students;
    var question, sid, student;
    var questions, sstudents;
    if (val3 == 'question') {
        var s_column = document.getElementById("gradingcolumn1");
        sstudents = s_column.selectedOptions;
        questions = col3.selectedOptions;
    } else if (val3 == 'student') {
        var q_column = document.getElementById("gradingcolumn2");
        sstudents = col3.selectedOptions;
        questions = q_column.selectedOptions;
        if (sstudents.length == 1 && (val1 == 'assignment' && getSelectedItem('assignment') != null)) {
            calculateTotals()
        } else {
            document.getElementById('assignmentTotalform').style.visibility = 'hidden';
        }
        //we know the question must come from column 2 now
    }

    $(rightSideDiv)[0].style.visibility = 'visible';
    rightSideDiv.html(""); //empty it out
    //Not sure if questions or students should be the outer loop
    for (var qnum = 0; qnum < questions.length; qnum++) {
        question = questions[qnum].value
        for (var snum = 0; snum < sstudents.length; snum++) {
            student = sstudents[snum].value
            for (var key in student_dict) {
                if (student_dict[key] == student) {
                    sid = key;
                }
            }
            if (!sid) {
                continue
            }
            var newid = "Q" + question.replace(/[#*@+:>~.\/ ]/g, '_') +
                "S" + sid.replace(/[#*@+:>~.\/]/g, '_');
            //This creates the equivalent of outerRightDiv for each question and student
            var divstring = '<div style="border:1px solid;padding:5px;margin:5px;" id="' + newid + '">';
            divstring += '<h4 id="rightTitle"></h4><div id="questiondisplay">Question Display</div>'
            divstring += '<div style="display:none" id="shortanswerresponse"></div>'
            divstring += '<div id="gradingform"><form>'
            divstring += '<label for="input-grade">Grade</label>'
            divstring += '<input id="input-grade" type="text" class="form-control" value="" />'
            divstring += '<label for="input-comments">Comments</label>'
            divstring += '<input id="input-comments" type="text" class="form-control" value="" />'
            divstring += '<input type="submit" value="Save Grade" class="btn btn-primary" /></form>'
            divstring += '<button class="btn btn-default next" type="button">Save and next</button></div>'
            divstring += '</div></div>'
            rightSideDiv.append(divstring)
            getRightSideGradingDiv($("#" + newid), question, sid);
        }
    }
}

function getSelectedGradingColumn(type) {
    //gradingoption1 has contents of picker for type of stuff in column (e.g., assignment, student)
    //gradingcolumn1 has contents of column (e.g., actual assignments)
    var opt1 = document.getElementById("gradingoption1");
    var col1Type = opt1.options[opt1.selectedIndex].value;

    var opt2 = document.getElementById("gradingoption2");
    var col2Type = opt2.options[opt2.selectedIndex].value;

    var opt3 = document.getElementById("gradingoption3");
    var col3type = opt3.options[opt3.selectedIndex].value;

    if (col1Type == type) {
        col = document.getElementById("gradingcolumn1");
    } else if (col2Type == type) {
        col = document.getElementById("gradingcolumn2");
    } else if (col3type == type) {
        col = document.getElementById("gradingcolumn3");
    } else {
        col = null;
    }
    return col;
}

function getSelectedItem(type) {
    var col = getSelectedGradingColumn(type);

    if (col == null) {
        return null;
    }
    if (type == "student") {
        if (col.selectedIndex != -1) {
            // they've selected an item; get the id associated with it
            id_diction = students
            var item = col.options[col.selectedIndex].value;
            for (var key in id_diction) {
                // one of these should match, since an item was selected!
                if (id_diction[key] == item) {
                    var id = key;
                }
            }
            return id;
        } else {
            return null;
        }
    } else if (type == "assignment") {
        if (col.selectedIndex != -1) {
            // they've selected an assignment; return that assignment name
            return col.options[col.selectedIndex].value;
        } else {
            return null;
        }
    } else if (type == "question") {
        if (col.selectedIndex != -1) {
            // they've selected a question; return that question name
            return col.options[col.selectedIndex].value;
        } else {
            return null;
        }
    }
}

function autoGrade() {
    var assignment = getSelectedItem("assignment")
    var question = getSelectedItem("question")
    var studentID = getSelectedItem("student")
    var enforceDeadline = $('#enforceDeadline').is(':checked')
    var params = {
        url: eBookConfig.autogradingURL,
        type: "POST",
        dataType: "JSON",
        data: {
            assignment: assignment,
            question: question,
            sid: studentID,
            enforceDeadline: enforceDeadline
        },
        success: function (retdata) {
            $('#assignmentTotalform').css('visibility', 'hidden');
            //alert(retdata.message);
        }
    }

    if (assignment != null && question === null && studentID == null) {
        (async function (students, ajax_params) {
            // Grade each student provided.
            let student_array = Object.keys(students);
            for (let index = 0; index < student_array.length; ++index) {
                let student = student_array[index];
                ajax_params.data.sid = student;
                res = await jQuery.ajax(ajax_params);
                $("#autogradingprogress").html(`Student ${index + 1} of ${student_array.length}: ${res.message} for ${student}`);
            }
            // Clear the graing progress.
            $("#autogradingprogress").html('');
            calculateTotals();
            $("#autogradesubmit").prop("disabled", false);
        })(students, params);
    } else {
        jQuery.ajax(params).always(function () {
            calculateTotals();
            $("#autogradesubmit").prop("disabled", false);
        });
    }

}

function calculateTotals(sid) {
    var assignment = getSelectedItem("assignment")
    var question = getSelectedItem("question")
    if (!sid) {
        var studentID = getSelectedItem("student")
    } else {
        studentID = sid
    }
    $('#assignmentTotalform').css('visibility', 'hidden');
    jQuery.ajax({
        url: eBookConfig.calcTotalsURL,
        type: "POST",
        dataType: "JSON",
        data: {
            assignment: assignment,
            question: question,
            sid: studentID
        },
        success: function (retdata) {
            if (retdata.computed_score != null) {
                //show the form for setting it manually
                $('#assignmentTotalform').css('visibility', 'visible');
                // populate it with data from retdata
                $('#computed-total-score').val(retdata.computed_score);
                $('#manual-total-score').val(retdata.manual_score);
            } else {
                alert(retdata.message);
            }
        }
    });
}

function saveManualTotal() {
    var assignment = getSelectedItem("assignment")
    var studentID = getSelectedItem("student")
    jQuery.ajax({
        url: eBookConfig.setTotalURL,
        type: "POST",
        dataType: "JSON",
        data: {
            assignment: assignment,
            sid: studentID,
            score: $('#manual-total-score').val(),
        },
        success: function (retdata) {
            if (!retdata.success) {
                alert(retdata.message);
            }
        }
    });
}

function sendLTI_Grade() {
    var assignment = getSelectedItem("assignment")
    var studentID = getSelectedItem("student")
    jQuery.ajax({
        url: eBookConfig.sendLTIGradeURL,
        type: "POST",
        dataType: "JSON",
        data: {
            assignment: assignment,
            sid: studentID,
        },
        success: function (retdata) {
            if (!retdata.success) {
                alert(retdata.message);
            }
        }
    });
}

function getRightSideGradingDiv(element, acid, studentId) {
    if (!eBookConfig.gradingURL) {
        alert("Can't grade without a URL");
        return false;
    }
    var elementID = $(element)[0].id; //some of this might be redundant
    // Clear any locally-stored info, which might be from showing another student's answer.
    // See ``runestonebase.js, localStorageKey()``.
    localStorage.removeItem(eBookConfig.email + ":" + eBookConfig.course + ":" + acid + "-given");
    //make an ajax call to get the htmlsrc for the given question
    var obj = new XMLHttpRequest();
    obj.open("GET", "/runestone/admin/htmlsrc/?acid=" + acid, true);
    obj.send(JSON.stringify({
        acid: acid
    }));
    obj.onreadystatechange = function () {
        if (obj.readyState == 4 && obj.status == 200) {
            var htmlsrc = JSON.parse(obj.responseText);
            var enforceDeadline = $('#enforceDeadline').is(':checked');
            var dl = new Date(assignment_deadlines[getSelectedItem("assignment")]);

            renderRunestoneComponent(htmlsrc, elementID + ">#questiondisplay", {
                sid: studentId,
                graderactive: true,
                enforceDeadline: enforceDeadline,
                deadline: dl
            });
        }

    };


    //this is an internal function for getRightSideGradingDiv
    function save(event) {
        event.preventDefault();

        //        if (form==undefined){form=$(this);} //This might be redundant
        var form = jQuery(this);
        var grade = jQuery('#input-grade', form).val();
        var comment = jQuery('#input-comments', form).val();
        jQuery.ajax({
            url: eBookConfig.gradeRecordingUrl,
            type: "POST",
            dataType: "JSON",
            data: {
                acid: acid,
                sid: studentId,
                grade: grade,
                comment: comment,
            },
            success: function (data) {
                jQuery('.grade', element).html(data.grade);
                jQuery('.comment', element).html(data.comment);
                calculateTotals(studentId);
            }
        });
    }

    function show(data) {
        // get rid of any other modals -- incase they are just hanging out.
        //jQuery('.modal.modal-grader:not(#modal-template .modal)').remove();

        var rightDiv = jQuery(element);

        jQuery('#gradingform', rightDiv).remove();
        var newForm = document.createElement('form');
        newForm.setAttribute('id', 'gradingform');
        formstr = '<form> <label for="input-grade">Grade</label> <input id="input-grade" type="text" class="form-control" value= ""/> <label for="input-comments">Comments</label> <input id="input-comments" type="text" class="form-control" value="" /> <input type="submit" value="Save Grade" class="btn btn-primary" /> </form> <button class="btn btn-default next" type="button">Save and next</button>';
        newForm.innerHTML = formstr;
        rightDiv[0].appendChild(newForm);

        jQuery('#rightTitle', rightDiv).html(data.name + ' <em>' + data.acid + '</em> <span>Points: ' + question_points[data.acid] + '</span>');


        if (data.file_includes) {
            // create divids for any files they might need
            var file_div_template = '<pre id="file_div_template" style = "display:none;">template text</pre>;'
            var index;
            for (index = 0; index < data.file_includes.length; index += 1) {
                if (jQuery('#' + data.file_includes[index].acid, rightDiv).length == 0) {
                    // doesn't exist yet, so add it.
                    jQuery('body').append(file_div_template);
                    jQuery('#file_div_template').text(data.file_includes[index].contents);
                    jQuery('#file_div_template').attr("id", data.file_includes[index].acid);
                }
            }
        }

        // pull in any prefix or suffix code, already retrieved in data
        var complete_code = data.code;
        if (data.includes) {
            complete_code = data.includes + '\n#### end of included code\n\n' + complete_code;
        }
        if (data.suffix_code) {
            complete_code = complete_code + '\n\n#### tests ####\n' + data.suffix_code;
        }



        // outerdiv, acdiv, sid, initialcode, language

        // Handle the save button
        jQuery('form', rightDiv).submit(save);
        // Handle the save and next button
        jQuery('.next', rightDiv).click(function (event) {
            event.preventDefault();
            jQuery('form', rightDiv).submit();
            // This next block should not run until save is complete.
            var col3 = document.getElementById("gradingcolumn3");
            try {
                var ind = col3.selectedIndex + 1;
                col3.selectedIndex = ind;
                col3.onchange();
            } catch (err) {
                //reached end of list
            }


        });
        try {
            jQuery('#' + data.id).focus();
        } catch (err) {
            // this will happen when you try to preview a reading assignment in the manual grading interface
            console.log(`Cannot preview ${data.id}`)
        }



        var divid;
        setTimeout(function () {

            //        jQuery.ajax({
            //        url: eBookConfig.gradeRecordingUrl,
            //        type: "POST",
            //        dataType: "JSON",
            //        data: {
            //            acid: acid,
            //            sid: studentId,
            //        },
            //        success: function () {
            //            //make an XML request to get the right stuff, pass in divid and studentId, then do the jQuery stuff below
            var obj = new XMLHttpRequest();
            obj.open('GET', '/runestone/admin/getGradeComments?acid=' + acid + '&sid=' + studentId, true);
            obj.send(JSON.stringify({
                newins: 'studentid'
            }));
            obj.onreadystatechange = function () {
                if (obj.readyState == 4 && obj.status == 200) {
                    var resp = obj.responseText;
                    var newdata = JSON.parse(resp);
                    if (newdata != "Error") {
                        jQuery('#input-grade', rightDiv).val(newdata['grade']);
                        jQuery('#input-comments', rightDiv).val(newdata['comments']);
                    } else {
                        jQuery('#input-grade', rightDiv).val(null);
                        jQuery('#input-comments', rightDiv).val(null);
                    }
                }
            }
        }, 250);
    }

    element.addClass("loading");
    var assignment = getSelectedItem("assignment")
    var enforceDeadline = $('#enforceDeadline').is(':checked')

    jQuery.ajax({
        url: eBookConfig.gradingURL,
        type: "POST",
        dataType: "JSON",
        data: {
            assignment: assignment,
            acid: acid,
            sid: studentId,
            enforceDeadline: enforceDeadline
        },
        success: function (data) {
            show(data);
        }
    });



}

function makeOption(text, value, disabledQ) {
    var option = document.createElement("option");
    option.text = text;
    option.value = value;
    if (disabledQ != undefined) {
        $(option).attr("disabled", true);
    }
    return option;

}

function populateQuestions(select, question_names) {
    $(select).empty();
    var chapter = "";
    for (i = 0; i < question_names.length; i++) {
        var q = question_names[i];
        var questiontext = "";
        //THE FOLLOWING IS EXPERIMENTAL AND CAN BE IGNORED FOR NOW.
        /*
        if (q.includes("/")) {//if the question has a / in it, assume it is chapter/subchapter
            var qL = q.split("/");
            if(chapter!=qL[0]){ //if the chapter changes, show it greyed out on a separate line
                chapter=qL[0];
                select.add(makeOption(chapter,"",true));
            }
            questiontext="   "+qL[1];
        } else {
*/
        questiontext = q;
        /*
        };*/
        select.add(makeOption(questiontext, question_names[i]));
    }
}

function updateColumn2() {
    var sel1 = document.getElementById("gradingoption1");
    var val1 = sel1.options[sel1.selectedIndex].value;
    var sel2 = document.getElementById("gradingoption2");
    var val2 = sel2.options[sel2.selectedIndex].value;
    var col1 = document.getElementById("gradingcolumn1");
    var col2 = document.getElementById("gradingcolumn2");
    var col1val = "";
    if (col1.selectedIndex > -1) {
        var col1val = col1.options[col1.selectedIndex].value;
    }
    if (val1 == 'assignment') {
        set_release_button();
        if (getSelectedItem('student') != null) {
            calculateTotals();
        } else {
            document.getElementById('assignmentTotalform').style.visibility = 'hidden';
        }
    }
    if (val1 == 'assignment' && val2 == 'question') {
        populateQuestions(col2, assignmentinfo[col1val]);
    } else if (val1 == 'chapter' && val2 == 'question') {
        //FIX: This is where we should get a list of all questions from the chapter
        //chapters[label] should store a list of all question names
        //populateQuestions should be a model for this.
        populateQuestions(col2, chapters[col1val]);
    } else if (val1 == 'student') {
        if (getSelectedItem('student') != null && getSelectedItem('assignment') != null) {
            calculateTotals();
        } else {
            document.getElementById('assignmentTotalform').style.visibility = 'hidden';
        }
    }

    if (val2 != "") {
        col2.style.visibility = 'visible';
    }
}

function updateColumn3() {
    var sel2 = document.getElementById("gradingoption2");
    var val2 = sel2.options[sel2.selectedIndex].value;
    var sel3 = document.getElementById("gradingoption3");
    var val3 = sel3.options[sel3.selectedIndex].value;
    var col2 = document.getElementById("gradingcolumn2");
    var col3 = document.getElementById("gradingcolumn3");
    var col2VAL = col2.options[col2.selectedIndex].value;
    if (val2 == 'assignment') {
        set_release_button();
        if (getSelectedItem('student') != null && getSelectedItem('assignment') != null) {
            calculateTotals();
        } else {
            document.getElementById('assignmentTotalform').style.visibility = 'hidden';
        }
    }
    if (val2 == 'chapter' && val3 == 'question') {
        populateQuestions(col3, chapters[col2VAL]);
    } else if (val2 == 'assignment' && val3 == 'question') {
        populateQuestions(col3, assignmentinfo[col2VAL]);
    }

    if (val3 != "") {
        var lastcolval = col3.selectedIndex;
        if (lastcolval != -1) {
            gradeIndividualItem();
        }
        col3.style.visibility = 'visible';
    }

}

function pickedAssignments(column) {

    var pickedcolumn = document.getElementById(column);

    $("#" + column).empty();
    var assignments = assignmentinfo;
    set_release_button();
    autograde_form.style.visibility = 'visible';

    var keys = Object.keys(assignments);
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        var option = document.createElement("option");
        var key = keys[i];
        option.text = key;
        option.value = key;
        pickedcolumn.add(option);
        pickedcolumn.style.visibility = 'visible';

    }

}


function displayDefaultQuestion(column) {
    var pickedcolumn = document.getElementById(column);
    $("#" + column).empty();


    var option = document.createElement("option");
    option.text = '<- Choose option';
    option.value = 'default';
    pickedcolumn.add(option);
    $("option[value='default']").attr("disabled", "disabled");
    pickedcolumn.style.visibility = 'visible';
}


function pickedStudents(column) {

    var pickedcolumn = document.getElementById(column);
    $("#" + column).empty();
    // students = students.replace(/&#x27;/g, '"');
    var studentslist = students;
    var keys = [];
    var i;
    for (i in studentslist) {
        if (studentslist.hasOwnProperty(i)) {
            keys.push(i);
        }
    }

    // keep sort order determined by server side
    // keys.sort();

    for (i = 0; i < keys.length; i++) {
        var key = keys[i];
        var option = document.createElement("option");
        option.text = studentslist[key];
        option.value = studentslist[key]; // TODO: just store key here
        pickedcolumn.add(option);
        pickedcolumn.style.visibility = 'visible';

    }
}


function pickedChapters(column) {
    var pickedcolumn = document.getElementById(column);
    $("#" + column).empty();
    var keys = [];
    var i;
    for (i in chapters) {
        if (chapters.hasOwnProperty(i)) {
            keys.push(i);
        }
    }

    for (i = 0; i < keys.length; i++) {
        var key = keys[i];
        var option = document.createElement("option");
        option.text = key;
        option.value = key;
        pickedcolumn.add(option);
        pickedcolumn.style.visibility = 'visible';


    }

}

function makeOptions(select, texts) {
    $(select).children().each(
        function (i, option) {
            if (texts.includes(option.value)) {
                $(option).show();
            } else {
                $(option).hide(); //("disabled",true);
            }
        }
    );
}

function showColumn1() {

    var select1 = document.getElementById("gradingoption1");
    var select2 = document.getElementById("gradingoption2");
    var select3 = document.getElementById("gradingoption3");
    select2.selectedIndex = 0;
    select3.selectedIndex = 0;
    var val = select1.options[select1.selectedIndex].value;
    var val2 = select2.options[select2.selectedIndex].value;


    set_release_button();
    document.getElementById('assignmentTotalform').style.visibility = 'hidden';
    autograde_form = document.getElementById("autogradingform");
    autograde_form.style.visibility = 'hidden';

    $("#gradingcolumn2").empty();
    $("#gradingcolumn3").empty();

    if (val == 'assignment') {
        makeOptions(select2, ['question', '']);
        makeOptions(select3, ['student', '']);
        pickedAssignments("gradingcolumn1");
    } else if (val == 'chapter') {
        makeOptions(select2, ['question', '']);
        makeOptions(select3, ['student', '']);
        pickedChapters('gradingcolumn1');
    } else if (val == 'student') {
        makeOptions(select2, ['chapter', 'assignment', '']);
        makeOptions(select3, ['question', '']);
        pickedStudents('gradingcolumn1');
    }
}

function showColumn2() {

    var select1 = document.getElementById("gradingoption1");
    var select2 = document.getElementById("gradingoption2");
    var select3 = document.getElementById('gradingoption3');
    var val1 = select1.options[select1.selectedIndex].value;
    var val2 = select2.options[select2.selectedIndex].value;
    select3.selectedIndex = 0;

    if (val1 == "") {
        select2.selectedIndex = 0;
        alert("That is not a valid combination");
    } else {
        if (val2 == 'assignment') {
            makeOptions(select3, ["question"]);
            if (['assignment', 'chapter'].includes(val1)) {
                alert("That is not a valid combination");
                select2.selectedIndex = 0;
            } else {
                pickedAssignments("gradingcolumn2");
            }
        } else if (val2 == 'chapter') {
            makeOptions(select3, ['question']);
            document.getElementById('assignmentTotalform').style.visibility = 'hidden';
            if (['assignment', 'chapter'].includes(val1)) {
                alert("That is not a valid combination");
                $("#gradingcolumn2").empty();
                select2.selectedIndex = 0;
            } else {
                pickedChapters('gradingcolumn2');
            }
        } else if (val2 == 'question') {
            makeOptions(select3, ['student']);
            var preselected = false;
            if (select1.selectedIndex != -1) {
                var selectedval = select1.options[select1.selectedIndex].value;
                preselected = true;
            }
            if (['chapter', 'assignment'].includes(val1)) {
                if (preselected == true) {
                    updateColumn2();
                } else {
                    displayDefaultQuestion('gradingcolumn2');
                }
            } else {
                alert("That is not a valid combination");
                $("#gradingcolumn2").empty();
                select2.selectedIndex = 0;
            }
        }
    }
}

function showColumn3() {

    var select1 = document.getElementById("gradingoption3");
    var val = select1.options[select1.selectedIndex].value;
    var select = document.getElementById("gradingoption1");
    var val1 = select.options[select.selectedIndex].value;
    var select2 = document.getElementById("gradingoption2");
    var val2 = select2.options[select2.selectedIndex].value;
    if (val == 'question') {
        var select2 = document.getElementById("gradingcolumn2");
        var preselected = false;
        if (select2.selectedIndex != -1) {
            var selectedval = select2.options[select2.selectedIndex].value;
            preselected = true;
        }

        if (val1 == 'student' && val2 == 'chapter') {
            if (preselected == true) {
                updateColumn3();
            } else {
                displayDefaultQuestion('gradingcolumn3');
            }

        } else if (val1 == 'student' && val2 == 'assignment') {
            if (preselected == true) {
                updateColumn3();
            } else {
                displayDefaultQuestion('gradingcolumn3');
            }

        } else {
            alert("That is not a valid combination");
            select1.selectedIndex = 0;
            $("#gradingcolumn3").empty();


        }

    } else if (val == 'student') {

        if (val1 == 'chapter' && val2 == 'question') {
            pickedStudents("gradingcolumn3");
        } else if (val1 == 'assignment' && val2 == 'question') {
            pickedStudents("gradingcolumn3");
        } else {
            alert("That is not a valid combination");
            select1.selectedIndex = 0;
            $("#gradingcolumn3").empty();


        }

    }

}

function getCourseStudents() {
    jQuery.ajax({
        url: eBookConfig.getCourseStudentsURL,
        type: "POST",
        dataType: "JSON",
        data: {},
        success: function (retdata) {
            students = retdata;
        }
    });
}


function getStudents(sectionName) {
    var section = sectionName;

    var studentList = document.getElementById("studentNames");
    studentList.innerHTML = '';

    var obj = new XMLHttpRequest();
    obj.open("GET", "/runestone/sections/students/" + section, true);
    obj.send(JSON.stringify({
        sectionName: sectionName
    }));
    obj.onreadystatechange = function () {

        if (obj.readyState == 4 && obj.status == 200) {
            var students = JSON.parse(obj.responseText);
            var studentsNames = [];
            for (i = 0; i < students.length; i++) {
                studentsNames.push(students[i][1] + ", " + students[i][0]);
            }

            studentsNames.sort();

            for (i = 0; i < studentsNames.length; i++) {
                studentList.innerHTML += '<a href="#" class="list-group-item"> <h4 style="text-align: center" class="list-group-item-heading">' + studentsNames[i] + '</h4> </a>';
            }

            var total = document.getElementById("total");
            if (students == "") {
                total.innerHTML = "Total: 0";
            } else {
                total.innerHTML = "Total: " + students.length;
            }

        }
    }
}



// TODO: This function is also defined in admin.html. ???
function getLog() {


    var obj = new XMLHttpRequest();
    obj.open("GET", "/runestone/admin/getChangeLog", true);
    obj.send(JSON.stringify({
        variable: 'variable'
    }));
    obj.onreadystatechange = function () {

        if (obj.readyState == 4 && obj.status == 200) {
            changeLog = document.getElementById("changelog");
            changeLog.innerHTML = obj.responseText;
        }
    }
}


function add_instructor() {
    var select = document.getElementById('addins').elements['student'];
    var index = select.selectedIndex;
    var studentid = select.options[index].value; //value gives the value, text gives the actual text
    var studentname = select.options[index].text;

    var obj = new XMLHttpRequest();
    obj.open('POST', '/runestone/admin/addinstructor/' + studentid, true);
    obj.send(JSON.stringify({
        newins: 'studentid'
    }));
    obj.onreadystatechange = function () {
        if (obj.readyState == 4 && obj.status == 200) {
            studlist = document.getElementById('studentlist');
            studlist.remove(index);
            inslist = document.getElementById('instructorlist');
            newopt = document.createElement('option');
            newopt.value = studentid;
            newopt.innerHTML = studentname;
            inslist.appendChild(newopt);
        }
    }
}

function remove_instructor() {
    var select = document.getElementById('removeins').elements['instructor'];
    var index = select.selectedIndex;
    var studentid = select.options[index].value; //value gives the value, text gives the actual text
    var studentname = select.options[index].text;
    var obj = new XMLHttpRequest();
    obj.open('POST', '/runestone/admin/removeinstructor/' + studentid, true);
    obj.send(JSON.stringify({
        newins: 'studentid'
    }));
    obj.onreadystatechange = function () {
        if (obj.readyState == 4 && obj.status == 200) {
            gotdeleted = JSON.parse(obj.responseText);
            if (gotdeleted[0]) {
                inslist = document.getElementById('instructorlist');
                inslist.remove(index);
                studlist = document.getElementById('studentlist');
                newopt = document.createElement('option');
                newopt.value = studentid;
                newopt.innerHTML = studentname;
                studlist.appendChild(newopt);
            } else {
                //flash message that you can't remove yourself
            }
        }
    }
}


function edit_indexrst(form) {
    let data = {
        newtext: form.editIndex.value
    }
    jQuery.post('/runestone/admin/editindexrst', data, function () {
        alert("Successfully edited index.rst");
    });
}

// *************************
// Assignments tab functions
// *************************
// Initialize the `jsTree <https://www.jstree.com/>`_ question picker.
function configure_tree_picker(
    // A jQuery object (usually a ``div``) which will hold the tree picker.
    picker,
    // Data to populate the tree with.
    picker_data,
    // A jQuery object (usually an ``input``) used to search the tree.
    picker_search_input,
    // The depth of a leaf node.
    leaf_depth,
    // The function to call when a leaf node is checked. It's passed the leaf node.
    checked_func,
    // The function to call when a leaf node is unchecked. It's passed the leaf node.
    unchecked_func) {


    picker.jstree({
        // Configure the checkbox plugin.
        "checkbox": {
            // This prevents the selection from including all auto-checked nodes, which I find distracting.
            "keep_selected_style": false,
            // Setting `whole_node <https://www.jstree.com/api/#/?q=$.jstree.defaults.checkbox&f=$.jstree.defaults.checkbox.whole_node>`_ false only changes the checkbox state if the checkbox is clicked; this allows the user to select a node without adding/removing that question. This only works if ``tie_selection`` is false.
            "whole_node": false,
            // `Scary-sounding <https://www.jstree.com/api/#/?q=$.jstree.defaults&f=$.jstree.defaults.checkbox.tie_selection>`_ setting to make the above work, and to make the ``check_node.jstree`` event actually fire.
            "tie_selection": false,
        },
        // Enable `plugins <https://www.jstree.com/plugins/>`_.
        "plugins": [
            "checkbox",
            "search",
        ],
        // Populate the tree from JSON (`docs <https://www.jstree.com/docs/json/>`_).
        "core": {
            "data": picker_data,
            "themes": {
                // Note that the CSS for the theme (`proton <https://www.orangehilldev.com/jstree-bootstrap-theme/demo/>`_) must also be loaded -- see assignments.html.
                "name": "proton",
                "responsive": true,
            },
            // Allow modifying the tree programatically. See https://www.jstree.com/api/#/?f=$.jstree.defaults.core.check_callback.
            "check_callback": true,
        },
    });

    // Provide a flag to use to ignore events caused when loading the table data in.
    picker.jstree(true).ignore_check = false;

    // Set up for searching. Copied from the search plugin example.
    var to = false;
    picker_search_input.keyup(function () {
        if (to) {
            clearTimeout(to);
        }
        to = setTimeout(function () {
            var v = picker_search_input.val();
            picker.jstree(true).search(v);
        }, 250);
    });

    // Ask for events_ when a node is `checked <https://www.jstree.com/api/#/?q=.jstree Event&f=check_node.jstree>`_.
    picker.on('check_node.jstree', function (event, data) {
        if (data.node.text == "Exercises" || event.target.id === "tree-question-picker") {
            let num_ex = data.node.children.length;
            if (num_ex > 10 || data.node.parents.length == 1) {
                if (data.node.parents.length == 1) {
                    num_ex = "A LOT OF"
                }
                let resp = confirm(`Warning!  You are about to add ${num_ex} Excercises (without even looking at them) to this assignment.  Do you Really want to do that??`)
                if (! resp) {
                    $("#tree-question-picker").jstree("uncheck_node", data.node.id)
                    return
                }
            }
        }
        if (!data.instance.ignore_check) {
            walk_jstree(data.instance, data.node, async function (instance, node) {
                if (jstree_node_depth(instance, node) == leaf_depth) {
                    // Add each checked item to the assignment list with default values.
                    let resp = await checked_func(node);  // checked_func is either  updateReading or updateAssignmentRaw
                    if (resp.assign_type == 'reading') {
                        add_to_table(resp);
                    } else {
                        add_to_qtable(resp);
                    }
                }
            });
        }
    });

    // Ask for events_ when a node is `unchecked <https://www.jstree.com/api/#/?q=.jstree Event&f=uncheck_node.jstree>`_.
    picker.on('uncheck_node.jstree', function (event, data) {
        if (!data.instance.ignore_check) {
            walk_jstree(data.instance, data.node, function (instance, node) {
                if (jstree_node_depth(instance, node) == leaf_depth) {
                    unchecked_func(node);
                }
            });
        }
    });
}

// Given a jstree node, return its depth in the tree.
function jstree_node_depth(instance, node) {
    // Just checking if node has no children isn't sufficient -- some subchapters have no questions, for example, meaning they also have no children. Instead, find the length of the `path to this node <https://www.jstree.com/api/#/?f=get_path(obj [, glue, ids])>`_.
    return instance.get_path(node).length;
}

// Given a jstree node, invoke f on node and all its children.
async function walk_jstree(instance, node, f) {
    await f(instance, node);
    for (let value of node.children) {
        await walk_jstree(instance, instance.get_node(value), f);
    }
}

// Given an editable element (a hyperlink) in a bootstrap table, return the containing row.
function row_from_editable(
    // The editable jQuery element which needs a menu.
    editable_element,
    // The table containing ``editable_element``.
    table) {

    // Determine which row this editable is associated with. First, find the index of this row. Note that `parentsUntil <https://api.jquery.com/parentsUntil/>`_ returns a list of all parents up to, but not including, the provided target. Therefore, ask for the ``tbody``, since the element before will be the ``tr`` with the ``data-index`` we want.
    var row_index = $(editable_element).parentsUntil('tbody').last().attr('data-index');
    return table.bootstrapTable('getData')[row_index];
}

// Given an editable element (a hyperlink) in the a bootstrap table, return the menu data for it.
function menu_from_editable(
    // The editable jQuery element which needs a menu.
    editable_element,
    // A dict which translates from values from the DB to user-friendly labels.
    ui,
    // The key to the row which gives allowable values from which to create a menu.
    row_key,
    // The table containing ``editable_element``.
    table) {

    // Determine which row this editable is associated with.
    var row = row_from_editable(editable_element, table);
    // Determine the appropriate menu for this question. First, find its autograde values in the tree.
    // Map these to the format necessary for a select control.
    var select_source = [];
    for (let val of row[row_key]) {
        select_source.push({
            value: val,
            text: ui[val]
        });
    }
    return select_source;
}


function fillinAssignmentName(target) {
    //On the assignments tab, fill in the target with the name of the current assignment
    //Only used by the rename assignment button for now
    select = $("#assignlist")[0]
    $("#" + target).html(select.options[select.selectedIndex].innerHTML)
}
//Invoked by the "Rename" button of the "Rename Assignment" dialog
function renameAssignment(form) {
    var select = $("#assignlist")[0]
    var id = select[select.selectedIndex].value
    var name = form['rename-name'].value;
    data = {
        'name': name,
        'original': id
    }
    url = '/runestone/admin/renameAssignment';
    jQuery.post(url, data, function (iserror, textStatus, whatever) {
        if (iserror == "EXISTS") {
            alert('There already is an assignment called "' + name + '".') //FIX: reopen the dialog box?
        } else if (iserror != 'ERROR') {
            //find the assignment
            select = $('#assignlist')[0];
            select.options[select.selectedIndex].innerHTML = name
        } else {
            alert('Error in renaming assignment ' + id)
        }
    }, 'json')
}
// Invoked by the "Create" button of the "Create Assignment" dialog.
function createAssignment(form) {
    var name = form.name.value;

    $('#assign_visible').prop('checked', true);
    data = {
        'name': name
    }
    url = '/runestone/admin/createAssignment';
    jQuery.post(url, data, function (iserror, textStatus, whatever) {
        if (iserror == "EXISTS") {
            alert('There already is an assignment called "' + name + '".') //FIX: reopen the dialog box?
        } else if (iserror != 'ERROR') {
            select = document.getElementById('assignlist');
            newopt = document.createElement('option');
            newopt.value = iserror[name];
            newopt.innerHTML = name;
            select.appendChild(newopt);
            select.selectedIndex = newopt.index;
            assignmentInfo();
        } else {
            alert('Error in creating new assignment.')
        }
    }, 'json')
}

// Triggered by the ``-`` button on the assignments tab.
function remove_assignment() {
    var select = document.getElementById('assignlist');
    var assignmentid = select.options[select.selectedIndex].value;
    var assignmentname = select.options[select.selectedIndex].text;

    if (!confirm(`Are you sure you want to remove the assignment ${assignmentname}?`)) {
        return;
    }

    var url = '/runestone/admin/removeassign';
    var data = {
        assignid: assignmentid
    };
    jQuery.post(url, data, function (res, status, whatever) {
        if (res != 'Error') {
            select.remove(select.selectedIndex);
            assignmentInfo();
        } else {
            alert("Could not remove assignment " + assignmentname);
        }
    });
}



// Update an assignment.
async function updateAssignmentRaw(question_name, points, autograde, which_to_grade) {
    var assignmentid = getAssignmentId();
    if (!assignmentid || assignmentid == "undefined") {
        alert("No assignment selected");
        return;
    }
    let res = await $.ajax({url: 'add__or_update_assignment_question',
        data: {question: question_name,
            assignment: assignmentid,
            points: points,
            autograde: autograde,
            which_to_grade: which_to_grade,
            assign_type: 'problems'
        },
        dataType: 'json'});

    return res;
}

async function add_to_qtable(response_JSON) {
    $('#totalPoints').html('Total points: ' + response_JSON['total']);
    // See if this question already exists in the table. Only append if it doesn't exist.
    if (question_table.bootstrapTable('getRowByUniqueId', response_JSON['question_id']) === null) {
        appendToQuestionTable(response_JSON['question_id'],
            response_JSON['points'],
            response_JSON['autograde'],
            response_JSON['autograde_possible_values'],
            response_JSON['which_to_grade'],
            response_JSON['which_to_grade_possible_values']);
    }
}


// Append a row to the question table.
function createQuestionObject(name, points, autograde, autograde_possible_values, which_to_grade, which_to_grade_possible_values) {
    var _id = 'question_table_' + name;
    return {
        question: '<a href="#component-preview" onclick="preview_question_id(\'' + name + '\');">' + name + '</a>',
        question_id: name,
        points: points,
        autograde: autograde,
        autograde_possible_values: autograde_possible_values,
        which_to_grade: which_to_grade,
        which_to_grade_possible_values: which_to_grade_possible_values,
        // Setting an _`ID for the row` is essential: the row reordering plugin depends on a valid row ID for the `drop message <https://github.com/wenzhixin/bootstrap-table/tree/master/src/extensions/reorder-rows#userowattrfunc>`_ to work. Setting the ``_id`` key is one way to accomplish this.
        _id: _id,
    };
}

function appendToQuestionTable(name, points, autograde, autograde_possible_values, which_to_grade, which_to_grade_possible_values) {
    question_table.bootstrapTable('append',
        [createQuestionObject(name,
            points,
            autograde,
            autograde_possible_values,
            which_to_grade,
            which_to_grade_possible_values)
        ]);
}

// Update the grading parameters used for an assignment.
function update_assignment(form) {
    if (!form.due.value) {
        alert("You must assign a due date to your assignment.")
        return;
    } else {
        try {
            d = new Date(form.due.value);
        } catch (e) {
            alert("Invalid Date: " + form.due.value);
            return;
        }
    }
    if (form.visible.checked) {
        form.visible.value = 'T';
    } else {
        form.visible.value = 'F';
    }
    $.getJSON('save_assignment', $(form).serialize() + '&assignment_id=' + getAssignmentId(), function (data) {
        alert("Assignment Saved");
    }).error(function () {
        alert("huh??")
    });
}

// Return the assignment id based on the value selected in the ``assignlist`` item.
function getAssignmentId() {
    var assignlist = document.getElementById('assignlist');
    return assignlist.options[assignlist.selectedIndex].value;
}


// Given a selected assignment, retrieve it from the server then display it.
function assignmentInfo() {
    // If no assignment is selected, hide all assignment-related panels.
    var select = document.getElementById('assignlist');
    if (select.selectedIndex === -1) {
        $('#rightSection').css('visibility', 'hidden');
        $('#leftpanel1').css('visibility', 'hidden');
        $('#leftpanel2').css('visibility', 'hidden');
        return;
    }

    var assignmentid = select.options[select.selectedIndex].value;
    $('#rightSection').css('visibility', 'visible');
    $("#leftpanel1").css('visibility', 'visible');
    $("#leftpanel2").css('visibility', 'visible');

    $.getJSON('get_assignment', {
        'assignmentid': assignmentid
    }, function (data) {
        assignmentData = data['assignment_data'];
        $('#totalPoints').html('Total points: ' + assignmentData['assignment_points']);
        $('#datetimepicker').val(assignmentData['due_date']);
        $('#assignment_description').val(assignmentData['description']);
        $('#readings-threshold').val(assignmentData['threshold']);
        $('#assign_visible').val(assignmentData['visible']);
        if (assignmentData['visible'] === true) {
            $('#assign_visible').prop('checked', true);
        } else {
            $('#assign_visible').prop('checked', false);
        }
        $('#readings-points-to-award').val(assignmentData['points_to_award']);
        $('#readings-autograder').val(assignmentData['readings_autograder']);

        // Update the questions
        ///====================
        // Get the question tree picker.
        var tqp = question_picker.jstree(true);
        // Ignore these checks in the picker, since it's loading existing data, not user interaction.
        tqp.ignore_check = true;
        // Clear all checks and the table initially.
        tqp.uncheck_all();
        question_table.bootstrapTable('removeAll');
        let allQuestions = []
        for (let question of data['questions_data']) {
            // Put the qeustion in the table.
            let name = question['name'];
            allQuestions.push(createQuestionObject(name, question['points'], question['autograde'], question['autograde_possible_values'], question['which_to_grade'], question['which_to_grade_possible_values']));
            // Check this question in the question tree picker.
            // Assumes that the picker tree is built before we do this loop.
            tqp.check_node(tqp.get_node(name));
        }

        question_table.bootstrapTable('load', allQuestions);

        // Future checks come from the user.
        tqp.ignore_check = false;

        // Update the readings
        ///===================
        // Same as above.
        var trp = readings_picker.jstree(true);
        trp.ignore_check = true;
        trp.uncheck_all();
        readings_table.bootstrapTable('removeAll');
        for (let readings_data of data['pages_data']) {
            id = readings_data['name'];
            trp.check_node(trp.get_node(id));
            appendToReadingsTable(id, readings_data['activity_count'], readings_data['activities_required'], readings_data['points'], readings_data['autograde'], readings_data['autograde_possible_values'], readings_data['which_to_grade'], readings_data['which_to_grade_possible_values']);
        }
        trp.ignore_check = false;
    });
}


// Update a reading.
// This should be serialized is the walk_jstree function to make sure the order is correct
async function updateReading(subchapter_id, activities_required, points, autograde, which_to_grade) {
    let assignid = getAssignmentId();
    if (!assignid || assignid == 'undefined') {
        alert("No assignment selected");
        return;
    }
    let res = await $.ajax({url: 'add__or_update_assignment_question',
        data: {
        assignment: assignid,
        question: subchapter_id,
        activities_required: activities_required,
        points: points,
        autograde: autograde,
        which_to_grade: which_to_grade,
        assign_type: 'reading',
        },
        dataType: 'json'});

    return res;
}

function add_to_table (response_JSON) {
    $('#totalPoints').html('Total points: ' + response_JSON['total']);
    // See if this question already exists in the table. Only append if it doesn't exist.
    if (readings_table.bootstrapTable('getRowByUniqueId', response_JSON['question_id']) === null) {
        appendToReadingsTable(response_JSON['question_id'],
            response_JSON['activity_count'],
            response_JSON['activities_required'],
            response_JSON['points'],
            response_JSON['autograde'],
            response_JSON['autograde_possible_values'],
            response_JSON['which_to_grade'],
            response_JSON['which_to_grade_possible_values']);
    }
}


// Append a row to the readings table given the ID of the reading.
function appendToReadingsTable(subchapter_id, activity_count, activities_required, points, autograde, autograde_possible_values, which_to_grade, which_to_grade_possible_values) {
    // Find this node in the tree.
    var node = readings_picker.jstree(true).get_node(subchapter_id);
    var _id = 'readings_table_' + node.id;
    readings_table.bootstrapTable('append', [{
        chapter: readings_picker.jstree(true).get_node(node.parent).text,
        subchapter: node.text,
        subchapter_id: node.id,
        activity_count: activity_count,
        activities_required: activities_required,
        points: points,
        autograde: autograde,
        autograde_possible_values: autograde_possible_values,
        which_to_grade: which_to_grade,
        which_to_grade_possible_values: which_to_grade_possible_values,
        // Set an `ID for the row`_.
        _id: _id,
    }]);
}

// Remove a reading from an assignment.
function remove_reading(reading_id) {
    $.getJSON('delete_assignment_question', {
        assignment_id: getAssignmentId(),
        name: reading_id,
    }).done(function (response_JSON) {
        readings_table.bootstrapTable('removeByUniqueId', reading_id);
    });
}

// Called to remove a question from an assignment.
function remove_question(question_name) {
    var assignment_id = getAssignmentId();
    $.getJSON('delete_assignment_question/?name=' + question_name + '&assignment_id=' + assignment_id, {
        variable: 'variable'
    }).done(function (response_JSON) {
        var totalPoints = document.getElementById("totalPoints");
        totalPoints.innerHTML = 'Total points: ' + response_JSON['total'];
        // Remove the named row from the table. See the `example <http://issues.wenzhixin.net.cn/bootstrap-table/#methods/removeByUniqueId.html>`__.
        question_table.bootstrapTable('removeByUniqueId', question_name);
    });
}
var chapterMap = {}

// Called when the "Write" button is clicked.
function display_write() {
    var template = document.getElementById('template');
    var questiontype = template.options[template.selectedIndex].value;
    jQuery.get('/runestone/admin/gettemplate/' + questiontype, {}, function (obj) {
        var returns = JSON.parse(obj);
        tplate = returns['template'];
        $("#qcode").text(tplate);
        $("#qcode").keypress(function() {
            $("#qrawhtml").val("");
        })
        $.each(returns['chapters'], function (i, item) {
            chapterMap[item[0]] = item[1];
            $('#qchapter').append($('<option>', {
                value: item[0],
                text: item[1]
            }));
        });
    });

    var hiddenwrite = document.getElementById('hiddenwrite');
    hiddenwrite.style.visibility = 'visible';
}

function find_name(lines) {
    var name = "";
    for (var i = 0; i < lines.length; i++) {
        if (lines[i] != "") {
            var line = lines[i];
            var match = line.split(/.. \w*:: /);
            name = match[1];
            break;
        }
    }
    return name
}

// Called when the "Done" button of the "Write" dialog is clicked.
function create_question(formdata) {
    if (formdata.qchapter.value == "Chapter") {
        alert("Please select a chapter for this question");
        return;
    }
    if (formdata.createpoints.value == "") {
        formdata.createpoints.value == "1"
    }
    if (!formdata.qrawhtml.value) {
        alert("No HTML for this question, please generate it.")
        return;
    }
    var activetab = 'formative';
    var select = document.getElementById('assignlist');
    var assignmentid = select.options[select.selectedIndex].value;
    var assignmentname = select.options[select.selectedIndex].text;
    var template = formdata.template.value;
    var qcode = formdata.qcode.value;
    var lines = qcode.split('\n');
    var htmlsrc = formdata.qrawhtml.value;
    var name = find_name(lines);
    var question = formdata.qcode.value;
    var difficulty = formdata.difficulty;
    for (var i = 0; i < difficulty.length; i++) {
        if (difficulty[i].checked == true) {
            var selectedDifficulty = difficulty[i].value;
        }
    }
    var tags = formdata.qtags.value;
    var chapter = formdata.qchapter.value;
    var isprivate = formdata.isprivate.checked;
    var points = formdata.createpoints.value;
    var timed = formdata.createtimed.checked;

    data = {
        'template': template,
        'name': name,
        'question': question,
        'difficulty': selectedDifficulty,
        'tags': tags,
        'chapter': chapter,
        'subchapter': 'Exercises',
        'isprivate': isprivate,
        'tab': activetab,
        'assignmentid': assignmentid,
        'points': points,
        'timed': timed,
        'htmlsrc': htmlsrc
    }
    url = '/runestone/admin/createquestion'
    jQuery.post(url, data, function (iserror, textStatus, whatever) {
        if (iserror == 'ERROR') {
            errortext = document.getElementById('qnameerror');
            errortext.innerHTML = 'Name is already in use. Please try a different name.'
        } else {
            alert('Question created successfully');
            var newPoints = iserror['points'];
            var q_type = activetab;
            var totalPoints = document.getElementById("totalPoints");
            totalPoints.innerHTML = 'Total points: ' + newPoints;
            // Add this question to the question picker and the table.
            var tqp = question_picker.jstree(true);
            // Find the exercises for this chapter. They have an ID set, making them easy to find.
            chapter = chapterMap[chapter];
            var exercises_node = tqp.get_node(chapter + ' Exercises');
            // See https://www.jstree.com/api/#/?f=create_node([par, node, pos, callback, is_loaded]).
            tqp.check_node(tqp.create_node(exercises_node, {
                id: name,
                text: name
            }));
        }
    }, 'json');
}

// Given a question ID, preview it.
function preview_question_id(question_id, preview_div) {
    if (arguments.length == 1) {
        preview_div = "component-preview"
    }
    // Request the preview HTML from the server.
    $.getJSON('/runestone/admin/htmlsrc', {
        "acid": question_id
    }).done(function (html_src) {
        // Render it.
        renderRunestoneComponent(html_src, preview_div, {acid: question_id})
    });
}


// Called by the "Preview" button of the "Write" panel.
function preview_question(form, preview_div) {
    if (arguments.length == 1) {
        preview_div = "component-preview"
    }
    var code = $(form.editRST).val();
    var data = {
        'code': JSON.stringify(code)
    };
    $.post('/runestone/ajax/preview_question', data, function (result, status) {
        let code = JSON.parse(result);
        $(form.qrawhtml).val(code); // store the un-rendered html for submission
        renderRunestoneComponent(code, preview_div)
    });
    // get the text as above
    // send the text to an ajax endpoint that will insert it into
    // a sphinx project, run sphinx, and send back the generated index file
    // this generated index can then be displayed...

}


// Render a question in the provided div.
function renderRunestoneComponent(componentSrc, whereDiv, moreOpts) {
    /**
     *  The easy part is adding the componentSrc to the existing div.
     *  The tedious part is calling the right functions to turn the
     *  source into the actual component.
     */
    patt = /..\/_images/g;
    componentSrc = componentSrc.replace(patt, `/${eBookConfig.app}/static/${eBookConfig.course}/_images`)
    jQuery(`#${whereDiv}`).html(componentSrc);

    edList = [];
    mcList = [];
    let componentKind = $($(`#${whereDiv} [data-component]`)[0]).data('component')
    let opt = {};
    opt.orig = jQuery(`#${whereDiv} [data-component]`)[0]
    if (opt.orig) {
        opt.lang = $(opt.orig).data('lang')
        opt.useRunestoneServices = false;
        opt.graderactive = false;
        opt.python3 = true;
        if (typeof moreOpts !== 'undefined') {
            for (let key in moreOpts) {
                opt[key] = moreOpts[key]
            }
        }
    }

    if (typeof component_factory === 'undefined') {
        alert("Error:  Missing the component factory!  Either rebuild your course or clear you browser cache.");
    } else {
        if (!component_factory[componentKind] && !jQuery(`#${whereDiv}`).html()) {
            jQuery(`#${whereDiv}`).html(`<p>Preview not available for ${componentKind}</p>`)
        } else {
            let res = component_factory[componentKind](opt);
            if (componentKind === 'activecode') {
                edList[res.divid] = res;
            }
        }
    }

    if (whereDiv != "modal-preview" && whereDiv != "questiondisplay") { // if we are in modal we are already editing
        $("#modal-preview").data("orig_divid", opt.acid || opt.orig.id); // save the original divid
        let editButton = document.createElement("button");
        $(editButton).text("Edit Source");
        $(editButton).addClass("btn btn-normal");
        $(editButton).attr("data-target", "#editModal");
        $(editButton).attr("data-toggle", "modal");
        $(editButton).click(function (event) {
            data = {
                question_name: opt.acid || opt.orig.id
            }
            jQuery.get('/runestone/admin/question_text', data,
                function (obj) {
                    $("#editRST").val(JSON.parse(obj));
                });
        });
        $(`#${whereDiv}`).append(editButton);
        let reportButton = document.createElement("button");
        $(reportButton).text("Flag for Review");
        $(reportButton).css("float", "right");
        $(reportButton).addClass("btn btn-warning");
        $(reportButton).click(function (event) {
            if (confirm("Clicking OK will mark this question for review as poor or inappropriate so that it may be removed.")) {
                data = {
                    question_name: opt.acid || opt.orig.id
                }
                jQuery.getJSON('/runestone/admin/flag_question.json', data,
                    function(obj) {
                        alert('Flagged -- This question will be reviewed by an editor');
                        $(reportButton).attr("disabled", true);
                    });
            }
        });
        $(`#${whereDiv}`).append(reportButton);
        $("#qrawhtmlmodal").val("")
        $("#editRST").keypress(function() {
            $("#qrawhtmlmodal").val(""); //ensure html refresh
        })
    }
}


// Called by the "Search" button in the "Search question bank" panel.
function questionBank(form) {
    var chapter = form.chapter.value;
    var author = form.author.value;
    var tags = $("#tags").select2("val");
    var term = form.term.value;
    var difficulty = "";
    var difficulty_options = ['rating1', 'rating2', 'rating3', 'rating4', 'rating5'];
    var inputs = document.getElementById('qbankform').getElementsByTagName('input');
    for (var i = 0, length = inputs.length; i < length; i++) {
        if (inputs[i].type == 'radio' && inputs[i].checked) {
            difficulty = inputs[i].value;
        }
    }

    var obj = new XMLHttpRequest();
    var url = '/runestone/admin/questionBank'
    var data = {
        variable: 'variable',
        chapter: chapter,
        difficulty: difficulty,
        author: author,
        tags: tags,
        term: term
    };
    jQuery.post(url, data, function (resp, textStatus, whatever) {
        resp = JSON.parse(resp)
        if (resp == 'Error') {
            alert("An error occured while searching")
        };
        var select = document.getElementById('qbankselect');
        select.onchange = getQuestionInfo;
        var questionform = document.getElementById('questionform');
        $("#qbankselect").empty();
        for (i = 0; i < resp.length; i++) {
            var option = document.createElement("option");
            option.text = resp[i];
            option.value = resp[i];
            option.onclick = getQuestionInfo;
            select.add(option);
        }
        if (resp.length == 0) {
            select.style.visibility = 'hidden';
            questionform.style.visibility = 'hidden';
            var q_info = document.getElementById('questionInfo');
            q_info.style.visibility = 'hidden';
            alert("Sorry, no questions matched your search criteria.");

        }
        if (resp.length > 0) {
            select.style.visibility = 'visible';
            questionform.style.visibility = 'visible';
        }
    });
}

// Called by the "Add to assignment" button in the "Search question bank" panel after a search is performed.
async function addToAssignment(form) {
    var points = form.points.value;
    var select = document.getElementById('qbankselect');
    var question_name = select.options[select.selectedIndex].text;

    let resp = await updateAssignmentRaw(question_name, points, 'manual', 'last_answer');
    add_to_qtable(resp);
}

// When a user clicks on a question in the select element of the "Search question bank" panel after doing a search, this is called.
function getQuestionInfo() {
    var select = document.getElementById('qbankselect');
    var question_name = select.options[select.selectedIndex].text;
    var assignlist = document.getElementById('assignlist');
    var assignmentid = assignlist.options[assignlist.selectedIndex].value;

    var url = '/runestone/admin/getQuestionInfo';
    var data = {
        variable: 'variable',
        question: question_name,
        assignment: assignmentid
    };
    jQuery.post(url, data, function (question_info, status, whatever) {
        var res = JSON.parse(question_info);
        var data = {};
        var i;
        for (i in res) {
            if (res.hasOwnProperty(i)) {
                data[i] = res[i];
            }
        }
        var difficulty = data['difficulty'];
        var code = data['code'];
        var author = data['author'];
        var tags = data['tags'];

        var q_difficulty = document.getElementById('q_difficulty');
        if (difficulty == null) {
            q_difficulty.innerHTML = 'Difficulty not set for this question';
        } else {
            q_difficulty.innerHTML = 'Difficulty: ' + difficulty;
        }


        renderRunestoneComponent(data['htmlsrc'], "component-preview", {acid: question_name})

        var q_author = document.getElementById('q_author');
        if (author == null) {
            q_author.innerHTML = 'No author for this question';
        } else {
            q_author.innerHTML = 'Author: ' + author;
        }

        var q_tags = document.getElementById('q_tags');
        q_tags.innerHTML = 'Tags:' + tags;
        var q_info = document.getElementById('questionInfo');
        q_info.style.visibility = 'visible';

    });
}


// Called from the editing modal when the save button is pressed
function edit_question(form) {

    if (!form.qrawhtml.value) {
        alert("You must generate the HTML for your edit.");
        return;
    }
    var tags = $("#addTags").select2("val");
    var difficulty = null;
    var difficulty_options = ['r1', 'r2', 'r3', 'r4', 'r5'];
    var inputs = document.getElementById('editForm').getElementsByTagName('input');
    for (var i = 0, length = inputs.length; i < length; i++) {
        if (inputs[i].type == 'radio' && inputs[i].checked) {
            difficulty = inputs[i].value;
        }
    }
    let orig_divid = $("#modal-preview").data("orig_divid")
    var question_text = form.editRST.value;
    var lines = form.editRST.value.split('\n');
    var htmlsrc = form.qrawhtml.value;
    var name = find_name(lines);
    data = {
        question: orig_divid,
        name: name,
        tags: tags,
        difficulty: difficulty,
        questiontext: question_text,
        htmlsrc: htmlsrc
    };
    jQuery.post('/runestone/admin/edit_question', data, function (myres) {
        alert(myres);
        if (myres.includes("Success")) {
            $('#editModal').modal('hide');
        }
    });
}


// ***********
// Grading tab
// ***********
// Return whether the assignment has been released for grading.
function get_assignment_release_states() {
    if (assignment_release_states == null) {
        // This has to be a synchronous call because we have to set assignment_release_states
        // before going on to later code that uses it
        jQuery.ajax({
            url: eBookConfig.get_assignment_release_statesURL,
            type: "POST",
            dataType: "JSON",
            async: false,
            success: function (retdata) {
                assignment_release_states = retdata;
            }
        });
    }
}

// Update the release button in the grading panel?
function set_release_button() {

    // first find out if there is an assignment selected
    var col1 = document.getElementById("gradingoption1");
    var col1val = col1.options[col1.selectedIndex].value;

    var col2 = document.getElementById("gradingoption2");
    var col2val = col2.options[col2.selectedIndex].value;
    var assignment = null;

    if (col1val == 'assignment') {
        var assignmentcolumn = document.getElementById("gradingcolumn1");
        if (assignmentcolumn.selectedIndex != -1) {
            assignment = assignmentcolumn.options[assignmentcolumn.selectedIndex].value;
        }
    } else if (col2val == 'assignment') {
        var assignmentcolumn = document.getElementById("gradingcolumn2");
        if (assignmentcolumn.selectedIndex != -1) {
            assignment = assignmentcolumn.options[assignmentcolumn.selectedIndex].value;
        }
    }

    // change the release button appropriately
    // var release_button = document.getElementById("releasebutton");
    var release_button = $('#releasebutton');
    if (assignment == null) {
        //hide the release grades button
        release_button.css('visibility', 'hidden');
    } else {
        release_button.css('visibility', 'visible');
        // see whether grades are currently live for this assignment
        get_assignment_release_states();
        var release_state = assignment_release_states[assignment];
        // If so, set the button text appropriately
        if (release_state == true) {
            release_button.text("Hide Grades from Students for " + assignment);
        } else {
            release_button.text("Release Grades to Students for " + assignment);
        }
    }
}

function toggle_release_grades() {
    var col1 = document.getElementById("gradingoption1");
    var col1val = col1.options[col1.selectedIndex].value;

    var col2 = document.getElementById("gradingoption2");
    var col2val = col2.options[col2.selectedIndex].value;
    var assignment = null;

    if (col1val == 'assignment') {
        var assignmentcolumn = document.getElementById("gradingcolumn1");
        if (assignmentcolumn.selectedIndex != -1) {
            assignment = assignmentcolumn.options[assignmentcolumn.selectedIndex].value;

        } else {
            alert("Please choose an assignment first");
        }
    } else if (col2val == 'assignment') {

        var assignmentcolumn = document.getElementById("gradingcolumn2");
        if (assignmentcolumn.selectedIndex != -1) {
            assignment = assignmentcolumn.options[assignmentcolumn.selectedIndex].value;

        } else {
            alert("Please choose an assignment first");
        }

    }

    if (assignment != null) {
        //go release the grades now
        get_assignment_release_states()
        release_state = assignment_release_states[assignment];
        var ids = assignmentids;
        var assignmentid = ids[assignment];
        if (release_state == true) {
            // Have to toggle the local variable before making the asynch call, so that button will be updated correctly
            assignment_release_states[assignment] = null;
            let data = {
                assignmentid: assignmentid,
                released: 'no'
            };

            jQuery.post('/runestone/admin/releasegrades', data, function (mess, stat, w) {
                alert(`${mess} Grades are now hidden from students for ${assignment}`);
            });
        } else {
            // Have to toggle the local variable before making the asynch call, so that button will be updated correctly
            assignment_release_states[assignment] = true;
            let data = {
                assignmentid: assignmentid,
                released: 'yes'
            };

            jQuery.post('/runestone/admin/releasegrades', data, function (mess, stat, w) {
                alert(`${mess}: Grades are now visible to students for ${assignment}`);
            });
        }
        set_release_button();
    }
}


function copyAssignments() {
    let selectedCourse = document.getElementById("courseSelection").value;
    data = {
        oldassignment: -1,
        course: selectedCourse
    };
    $.post("/runestone/admin/copy_assignment", data, function (mess, stat, w) {
        if (mess == "success") {
            alert('Done')
        } else {
            alert('Copy Failed')
        }
    });
}


function updateCourse(widget, attr) {
    console.log(widget.value);
    data = {}
    data[attr] = widget.value
    if (attr == 'downloads_enabled' || attr == 'allow_pairs') {
        data[attr] = widget.checked
    }

    $.getJSON("/runestone/admin/update_course.json", data, function (retval, stat, w) {
        if (retval.status != "success") {
            alert("Update Failed");
        }
    })
}