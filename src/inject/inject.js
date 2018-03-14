let timelineAdded = 0

chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval)

      const s = document.createElement('script')
      s.src = chrome.extension.getURL('https://www.gstatic.com/charts/loader.js')
      s.onload = function () {
        this.remove()
      };
      (document.head || document.documentElement).appendChild(s)

      $(document).on('DOMNodeInserted', () => {
        if (timelineAdded < 1 && $('#report-specific-data').size() > 0) {
          timelineAdded++

          console.log('Found!')
          $('#report-specific-data').prepend(`
            <section id="timeline" style="margin-bottom: 50px">
                <div class="row reports-activity-chart">
                    <div class="twentyfour columns" id="visualization">
                    </div>
                </div>
            </section>
          `)

          console.log('Added!')

          const items = new vis.DataSet()

          $.getJSON('https://www.toggl.com/api/v9/me/time_entries?since=', null, (entries) => {
            console.log(entries)

            const usedGroups = {}

            for (const entry of entries) {
              items.add({
                id: entry.id,
                content: entry.description,
                start: new Date(entry.start),
                end: new Date(entry.stop),
                group: entry.project_id
              })

              usedGroups[entry.project_id] = true
            }

            console.log(items)

            // DOM element where the Timeline will be attached
            const container = document.getElementById('visualization')

            // Configuration for the Timeline
            const options = {
              autoResize: true,
              clickToUse: true,
              hiddenDates: [{
                start: '2017-03-04 00:00:00',
                end: '2017-03-06 00:00:00',
                repeat: 'weekly'
              },
                // hide outside of 9am to 5pm - use any 2 days and repeat daily
                {
                  start: '2017-03-04 20:00:00',
                  end: '2017-03-05 08:00:00',
                  repeat: 'daily'
                }
              ]
            }

            // Create a Timeline
            // TODO use momentjs
            const timeline = new vis.Timeline(container, items, options)

            timeline.moveTo(new Date())
            timeline.setWindow(new Date(new Date().getTime() - 2 * 24 * 3600 * 1000), new Date(new Date().getTime() + 6 * 3600 * 1000))

            $.getJSON('https://www.toggl.com/api/v9/me/projects', null, (projects) => {
              const groups = []

              console.log(usedGroups)

              for (group of projects) {
                groups.push({
                  id: group.id,
                  content: group.name,
                  visible: (usedGroups[group.id] === true)
                })
              }

              timeline.setGroups(groups)
            })

          })

        }

      })

    }
  }, 10)
})